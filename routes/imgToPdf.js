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

    // ⚡ Bolt Optimization: Use a sequential for...of loop and await fs.promises
    // to process batch files asynchronously. We avoid Promise.all() here
    // deliberately to prevent massive memory spikes and OOM errors when users
    // upload many large images.
    for (const file of req.files) {
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

      // Async cleanup
      try {
        await fs.promises.unlink(file.path);
      } catch (cleanupErr) {
        if (cleanupErr.code !== 'ENOENT') {
          console.error(`Error cleaning up file ${file.path}:`, cleanupErr);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const compiledFilename = `compiled-${uniqueSuffix}.pdf`;
    const outputPath = path.join(COMPRESSED_DIR, compiledFilename);

    await fs.promises.writeFile(outputPath, pdfBytes);

    // ⚡ Bolt Optimization: Use async fs.promises to get file size instead of blocking statSync
    const pdfStats = await fs.promises.stat(outputPath);
    const pdfSize = pdfStats.size;

    res.json({
      success: true,
      imageCount: req.files.length,
      pdfSize: pdfSize,
      downloadUrl: `/api/download/${compiledFilename}`
    });
  } catch (err) {
    console.error('Image to PDF error:', err);
    // Cleanup any remaining files asynchronously on error
    for (const file of req.files) {
      try {
        await fs.promises.unlink(file.path);
      } catch (cleanupErr) {
        if (cleanupErr.code !== 'ENOENT') {
          console.error(`Error cleaning up file ${file.path}:`, cleanupErr);
        }
      }
    }
    res.status(500).json({ error: 'Failed to compile images into PDF.' });
  }
});

module.exports = router;
