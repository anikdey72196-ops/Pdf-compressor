const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { upload, COMPRESSED_DIR, execGhostscript } = require('./config');

router.post('/unlock', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const originalSize = req.file.size;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const unlockedFilename = `unlocked-${uniqueSuffix}.pdf`;
  const outputPath = path.join(COMPRESSED_DIR, unlockedFilename);

  try {
    // ⚡ Bolt Optimization: Use async fs.promises.readFile to avoid blocking the event loop
    const pdfBytes = await fs.promises.readFile(inputPath);
    let unlocked = false;

    // 1. Try pdf-lib to strip encryption & restriction flags
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const unlockedBytes = await pdfDoc.save();
      await fs.promises.writeFile(outputPath, unlockedBytes);
      unlocked = true;
    } catch (pdfLibErr) {
      console.warn('pdf-lib unlock fallback to Ghostscript:', pdfLibErr.message);
    }

    // Check if output was actually written
    let outputExists = false;
    try {
      await fs.promises.access(outputPath);
      outputExists = true;
    } catch (err) {
      // Ignore
    }

    // 2. Fallback to Ghostscript if pdf-lib didn't write output
    if (!unlocked || !outputExists) {
      const gsArgs = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputPath
      ];
      await new Promise((resolve, reject) => {
        execGhostscript(gsArgs, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // ⚡ Bolt Optimization: Async file deletion to avoid event loop blocking
    try {
      await fs.promises.unlink(inputPath);
    } catch (unlinkErr) {
      if (unlinkErr.code !== 'ENOENT') console.error('Unlock PDF cleanup error:', unlinkErr);
    }

    // ⚡ Bolt Optimization: Async stat
    const outputStats = await fs.promises.stat(outputPath);
    const unlockedSize = outputStats.size;

    res.json({
      success: true,
      originalName: originalName,
      originalSize: originalSize,
      unlockedSize: unlockedSize,
      downloadUrl: `/api/download/${unlockedFilename}`
    });
  } catch (err) {
    console.error('Unlock PDF error:', err);
    try {
      await fs.promises.unlink(inputPath);
    } catch (unlinkErr) {
      if (unlinkErr.code !== 'ENOENT') console.error('Unlock PDF error cleanup error:', unlinkErr);
    }
    res.status(500).json({ error: 'Failed to unlock PDF. The file may have strong user-open encryption.' });
  }
});

module.exports = router;
