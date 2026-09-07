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
    // ⚡ Bolt Optimization: Use async file read to prevent blocking the event loop
    const dataBuffer = await fs.promises.readFile(inputPath);
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

    // ⚡ Bolt Optimization: Use async buffer generation and write to avoid blocking the event loop
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await fs.promises.writeFile(outputPath, excelBuffer);

    // ⚡ Bolt Optimization: Replace sync unlink with async to unblock event loop
    try {
      await fs.promises.unlink(inputPath);
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Error deleting file ${inputPath}:`, err);
    }

    res.json({
      success: true,
      rowCount: tableRows.length,
      downloadUrl: `/api/download/${excelFilename}`
    });
  } catch (err) {
    console.error('PDF to Excel error:', err);
    // ⚡ Bolt Optimization: Ensure concurrent cleanup uses async IO in the catch block
    try {
      await fs.promises.unlink(inputPath);
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`Error cleaning up file ${inputPath}:`, e);
    }
    res.status(500).json({ error: 'Failed to extract PDF data to Excel spreadsheet.' });
  }
});

module.exports = router;
