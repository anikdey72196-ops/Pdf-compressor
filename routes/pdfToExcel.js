const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
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
    const dataBuffer = await fs.promises.readFile(inputPath);
    const parsedData = await pdfParse(dataBuffer);

    const textLines = (parsedData.text || '').split('\n').filter(line => line.trim().length > 0);
    const tableRows = textLines.map((line) => {
      const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
      return [line.trim()];
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Extracted Data');
    if (tableRows.length > 0) {
      tableRows.forEach(row => worksheet.addRow(row));
    } else {
      worksheet.addRow(['No text content found in PDF']);
    }

    await workbook.xlsx.writeFile(outputPath);

    if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);

    res.json({
      success: true,
      rowCount: tableRows.length,
      downloadUrl: `/api/download/${excelFilename}`
    });
  } catch (err) {
    console.error('PDF to Excel error:', err);
    if (fs.existsSync(inputPath)) {
      try {
        await fs.promises.unlink(inputPath);
      } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to extract PDF data to Excel spreadsheet.' });
  }
});

module.exports = router;
