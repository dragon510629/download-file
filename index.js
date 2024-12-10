const express = require('express');
const puppeteer = require('puppeteer');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

app.use(express.json()); // Middleware để parse JSON request body

app.get('/', async (req, res) => {
  res.status(200).send("hello");
})

// API endpoint nhận mảng HTML và trả về ảnh hoặc file ZIP chứa các ảnh
app.post('/download-images', async (req, res) => {
  const { htmlContents } = req.body; // Nhận mảng HTML từ frontend
  const zip = new JSZip(); // Tạo một ZIP mới

  try {
    // Khởi động Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Nếu mảng chỉ có một phần tử, render ảnh và trả về ngay
    if (htmlContents.length === 1) {
      const htmlContent = htmlContents[0];

      // Set content của page thành HTML hiện tại
      await page.setContent(htmlContent);

      // Chụp ảnh của toàn bộ trang HTML
      const screenshotBuffer = await page.screenshot({ fullPage: true });

      // Trả về ảnh trực tiếp nếu chỉ có một phần tử trong mảng
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="ticket.png"');
      res.send(screenshotBuffer);
    } else {
      // Nếu mảng có nhiều phần tử, render từng phần tử HTML thành ảnh và thêm vào ZIP
      for (let i = 0; i < htmlContents.length; i++) {
        const htmlContent = htmlContents[i];

        // Set content của page thành HTML hiện tại
        await page.setContent(htmlContent);

        // Chụp ảnh của toàn bộ trang HTML và thêm vào file ZIP
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        zip.file(`ticket-${i + 1}.png`, screenshotBuffer); // Thêm ảnh vào file ZIP
      }

      // Đóng browser sau khi hoàn tất
      await browser.close();

      // Tạo file ZIP và gửi về cho frontend
      zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=tickets.zip');
        res.send(content); // Trả về file ZIP cho frontend
      });
    }
  } catch (err) {
    console.error('Error processing HTML to image', err);
    res.status(500).send('Internal server error');
  }
});

// Khởi động server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});
