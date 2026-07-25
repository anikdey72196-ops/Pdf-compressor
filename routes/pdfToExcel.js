const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');
const { upload, COMPRESSED_DIR } = require('./config');

router.post('/pdf-to-excel', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const excelFilename = `pdf-excel-${uniqueSuffix}.xlsx`;
  const outputPath = path.join(COMPRESSED_DIR, excelFilename);

  try {
    const dataBuffer = fs.readFileSync(inputPath);
    const parsedData = await pdfParse(dataBuffer);

    const textLines = (parsedData.text || '').split('\n').filter(line => line.trim().length > 0);
    const tableRows = textLines.map((line, idx) => {
      const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
      return [line.trim()];
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(tableRows.length > 0 ? tableRows : [['No text content found in PDF']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

    XLSX.writeFile(workbook, outputPath);

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.json({
      success: true,
      rowCount: tableRows.length,
      downloadUrl: `/api/download/${excelFilename}`
    });
  } catch (err) {
    console.error('PDF to Excel error:', err);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Failed to extract PDF data to Excel spreadsheet.' });
  }
});

module.exports = router;
