const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { uploadImages, COMPRESSED_DIR } = require('./config');

router.post('/img-to-pdf', uploadImages.array('images', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files were uploaded.' });
  }

  try {
    const pdfDoc = await PDFDocument.create();

    // Process files sequentially with async I/O to avoid OOM errors and blocking the event loop
    for (const file of req.files) {
      // Opt: use async I/O to avoid blocking main thread
      const imageBytes = await fs.promises.readFile(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      let image;

      if (ext === '.png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });

      // Opt: async file deletion with try/catch to avoid race conditions and blockages
      try {
        await fs.promises.unlink(file.path);
      } catch (e) {
        if (e.code !== 'ENOENT') console.error('Cleanup error:', e);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const compiledFilename = `compiled-${uniqueSuffix}.pdf`;
    const outputPath = path.join(COMPRESSED_DIR, compiledFilename);

    await fs.promises.writeFile(outputPath, pdfBytes);
    // Opt: Use async stat to prevent blocking
    const stat = await fs.promises.stat(outputPath);
    const pdfSize = stat.size;

    res.json({
      success: true,
      imageCount: req.files.length,
      pdfSize: pdfSize,
      downloadUrl: `/api/download/${compiledFilename}`
    });
  } catch (err) {
    console.error('Image to PDF error:', err);
    // Opt: Use async loop for cleanup on error
    for (const file of req.files) {
      try {
        await fs.promises.unlink(file.path);
      } catch (e) {
        if (e.code !== 'ENOENT') console.error('Cleanup error:', e);
      }
    }
    res.status(500).json({ error: 'Failed to compile images into PDF.' });
  }
});

module.exports = router;
