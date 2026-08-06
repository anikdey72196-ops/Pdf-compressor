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

    for (const file of req.files) {
      // ⚡ Bolt Optimization: Use async readFile to prevent blocking the event loop
      // We read files sequentially instead of Promise.all to avoid huge memory spikes with many large images
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

      // ⚡ Bolt Optimization: Async cleanup handling ENOENT safely
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
    // ⚡ Bolt Optimization: Use async stat
    const stats = await fs.promises.stat(outputPath);
    const pdfSize = stats.size;

    res.json({
      success: true,
      imageCount: req.files.length,
      pdfSize: pdfSize,
      downloadUrl: `/api/download/${compiledFilename}`
    });
  } catch (err) {
    console.error('Image to PDF error:', err);
    // ⚡ Bolt Optimization: Async parallel cleanup on error
    await Promise.all(
      req.files.map(async file => {
        try {
          await fs.promises.unlink(file.path);
        } catch (e) {
          if (e.code !== 'ENOENT') console.error('Cleanup error:', e);
        }
      })
    );
    res.status(500).json({ error: 'Failed to compile images into PDF.' });
  }
});

module.exports = router;
