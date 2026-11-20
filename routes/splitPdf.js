const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');
const { upload, COMPRESSED_DIR, isValidPdfHeader } = require('./config');

/**
 * Parses user range string (e.g. "1-3, 5, 8-10") into unique sorted 0-based page indices
 */
function parsePageRange(rangeStr, maxPages) {
  if (!rangeStr || typeof rangeStr !== 'string') return [];
  const pages = new Set();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const sides = part.split('-');
      const start = parseInt(sides[0], 10);
      const end = parseInt(sides[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p - 1); // 0-based index
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

// Split PDF into multiple pages or extract specific page ranges
router.post('/split-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const inputPath = req.file.path;

  try {
    const isValid = await isValidPdfHeader(inputPath);
    if (!isValid) {
      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (e) {}
      }
      return res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
    }

    const mode = req.body.mode === 'range' ? 'range' : 'all';
    const pdfBytes = await fs.promises.readFile(inputPath);
    const srcPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPages = srcPdf.getPageCount();

    if (totalPages === 0) {
      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (e) {}
      }
      return res.status(400).json({ error: 'The uploaded PDF has no pages.' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    if (mode === 'all') {
      // Split all pages into individual PDFs inside a ZIP
      const zip = new AdmZip();

      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcPdf, [i]);
        singleDoc.addPage(copiedPage);
        const singleBytes = await singleDoc.save();
        const pageNum = String(i + 1).padStart(String(totalPages).length, '0');
        zip.addFile(`page-${pageNum}.pdf`, Buffer.from(singleBytes));
      }

      const zipFilename = `split-${uniqueSuffix}.zip`;
      const outputPath = path.join(COMPRESSED_DIR, zipFilename);
      const zipBuffer = zip.toBuffer();

      await fs.promises.writeFile(outputPath, zipBuffer);

      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (e) {}
      }

      return res.json({
        success: true,
        mode: 'all',
        downloadUrl: `/api/download/${zipFilename}`,
        totalPages: totalPages,
        extractedCount: totalPages,
        isZip: true,
        fileSize: zipBuffer.length
      });
    } else {
      // mode === 'range'
      const rangeStr = req.body.range || '';
      const selectedIndices = parsePageRange(rangeStr, totalPages);

      if (selectedIndices.length === 0) {
        if (fs.existsSync(inputPath)) {
          try { await fs.promises.unlink(inputPath); } catch (e) {}
        }
        return res.status(400).json({
          error: `Invalid page range. Please specify valid page numbers between 1 and ${totalPages} (e.g. "1-3, 5").`
        });
      }

      const extractedDoc = await PDFDocument.create();
      const copiedPages = await extractedDoc.copyPages(srcPdf, selectedIndices);
      copiedPages.forEach((p) => extractedDoc.addPage(p));

      const extractedBytes = await extractedDoc.save();
      const splitPdfFilename = `split-${uniqueSuffix}.pdf`;
      const outputPath = path.join(COMPRESSED_DIR, splitPdfFilename);

      await fs.promises.writeFile(outputPath, extractedBytes);

      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (e) {}
      }

      return res.json({
        success: true,
        mode: 'range',
        downloadUrl: `/api/download/${splitPdfFilename}`,
        totalPages: totalPages,
        extractedCount: selectedIndices.length,
        isZip: false,
        fileSize: extractedBytes.length
      });
    }
  } catch (err) {
    console.error('Error during PDF split:', err);
    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }
    res.status(500).json({ error: `Failed to split PDF: ${err.message}` });
  }
});

module.exports = router;
