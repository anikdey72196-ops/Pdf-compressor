const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { upload, COMPRESSED_DIR, execGhostscript, isValidPdfHeader } = require('./config');

router.post('/unlock', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const inputPath = req.file.path;

  // Validate PDF magic header
  const isValidPdf = await isValidPdfHeader(inputPath);
  if (!isValidPdf) {
    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }
    return res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
  }

  const originalName = req.file.originalname;
  const originalSize = req.file.size;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const unlockedFilename = `unlocked-${uniqueSuffix}.pdf`;
  const outputPath = path.join(COMPRESSED_DIR, unlockedFilename);

  try {
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

    // 2. Fallback to Ghostscript if pdf-lib didn't write output
    if (!unlocked || !fs.existsSync(outputPath)) {
      const gsArgs = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dSAFER',
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

    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }

    let unlockedSize = 0;
    try {
      const stats = await fs.promises.stat(outputPath);
      unlockedSize = stats.size;
    } catch (e) {}

    res.json({
      success: true,
      originalName: originalName,
      originalSize: originalSize,
      unlockedSize: unlockedSize,
      downloadUrl: `/api/download/${unlockedFilename}`
    });
  } catch (err) {
    console.error('Unlock PDF error:', err);
    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to unlock PDF. The file may have strong user-open encryption.' });
  }
});

module.exports = router;
