const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { upload, COMPRESSED_DIR, isValidPdfHeader } = require('./config');

// Merge multiple PDF documents into one single PDF
router.post('/merge-pdf', upload.array('pdfs', 30), async (req, res) => {
  if (!req.files || req.files.length < 2) {
    // Clean up any uploaded file
    if (req.files) {
      for (const f of req.files) {
        if (fs.existsSync(f.path)) {
          try { await fs.promises.unlink(f.path); } catch (e) {}
        }
      }
    }
    return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
  }

  const uploadedFiles = req.files;

  try {
    // Validate that each uploaded file is a valid PDF
    for (const file of uploadedFiles) {
      const isValid = await isValidPdfHeader(file.path);
      if (!isValid) {
        // Clean up all files
        for (const f of uploadedFiles) {
          if (fs.existsSync(f.path)) {
            try { await fs.promises.unlink(f.path); } catch (e) {}
          }
        }
        return res.status(400).json({ error: `File "${file.originalname}" is not a valid PDF document.` });
      }
    }

    // Sort files according to specified custom order if provided
    let sortedFiles = [...uploadedFiles];
    if (req.body.order) {
      try {
        const orderList = JSON.parse(req.body.order);
        sortedFiles.sort((a, b) => {
          const indexA = orderList.indexOf(a.originalname);
          const indexB = orderList.indexOf(b.originalname);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } catch (err) {
        console.warn('Failed to sort PDFs with custom order list:', err.message);
      }
    }

    const mergedPdf = await PDFDocument.create();
    let totalPagesCount = 0;

    for (const file of sortedFiles) {
      const pdfBytes = await fs.promises.readFile(file.path);
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pageIndices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      totalPagesCount += pageIndices.length;
    }

    const mergedPdfBytes = await mergedPdf.save();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const mergedFilename = `merged-${uniqueSuffix}.pdf`;
    const outputPath = path.join(COMPRESSED_DIR, mergedFilename);

    await fs.promises.writeFile(outputPath, mergedPdfBytes);

    // Clean up uploaded temp files
    for (const file of uploadedFiles) {
      if (fs.existsSync(file.path)) {
        try { await fs.promises.unlink(file.path); } catch (e) {}
      }
    }

    res.json({
      success: true,
      downloadUrl: `/api/download/${mergedFilename}`,
      totalPages: totalPagesCount,
      totalFiles: sortedFiles.length,
      fileSize: mergedPdfBytes.length
    });
  } catch (err) {
    console.error('Error during PDF merge:', err);

    // Clean up on error
    for (const file of uploadedFiles) {
      if (fs.existsSync(file.path)) {
        try { await fs.promises.unlink(file.path); } catch (e) {}
      }
    }

    res.status(500).json({ error: `Failed to merge PDF files: ${err.message}` });
  }
});

module.exports = router;
