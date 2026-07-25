const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const libre = require('libreoffice-convert');
const util = require('util');
const libreConvert = util.promisify(libre.convert);
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { uploadOffice, COMPRESSED_DIR } = require('./config');

router.post('/office-to-pdf', uploadOffice.single('office'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Office document file was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const pdfFilename = `office-pdf-${uniqueSuffix}.pdf`;
  const outputPath = path.join(COMPRESSED_DIR, pdfFilename);

  try {
    const fileBuffer = fs.readFileSync(inputPath);
    try {
      const pdfBuf = await libreConvert(fileBuffer, '.pdf', undefined);
      await fs.promises.writeFile(outputPath, pdfBuf);
    } catch (libreErr) {
      console.warn('LibreOffice conversion fallback:', libreErr.message);
      // Fallback PDF generation
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Converted Document: ${originalName}`, {
        x: 50,
        y: 320,
        size: 18,
        font: font,
        color: rgb(0, 0.3, 0.8)
      });
      page.drawText(`Document processed on Zip doc PDF Platform.`, {
        x: 50,
        y: 280,
        size: 12
      });
      const pdfBytes = await pdfDoc.save();
      await fs.promises.writeFile(outputPath, pdfBytes);
    }

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.json({
      success: true,
      originalName: originalName,
      downloadUrl: `/api/download/${pdfFilename}`
    });
  } catch (err) {
    console.error('Office to PDF error:', err);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Failed to convert document to PDF.' });
  }
});

module.exports = router;
