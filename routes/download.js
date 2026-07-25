const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { COMPRESSED_DIR } = require('./config');

router.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(COMPRESSED_DIR, filename);

  if (fs.existsSync(filePath)) {
    let clientFilename = filename;
    if (filename.startsWith('compressed-')) {
      clientFilename = filename.replace(/^compressed-\d+-\d+-/, 'compressed_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('converted-')) {
      clientFilename = filename.replace(/^converted-\d+-\d+-/, 'converted_');
      if (!clientFilename.endsWith('.zip')) clientFilename += '.zip';
    } else if (filename.startsWith('compiled-')) {
      clientFilename = filename.replace(/^compiled-\d+-\d+-/, 'compiled_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('protected-')) {
      clientFilename = filename.replace(/^protected-\d+-\d+-/, 'protected_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('compressed-img-')) {
      clientFilename = filename.replace(/^compressed-img-\d+-\d+-/, 'compressed_image');
    } else if (filename.startsWith('word-')) {
      clientFilename = filename.replace(/^word-\d+-\d+-/, 'document_');
      if (!clientFilename.endsWith('.docx')) clientFilename += '.docx';
    } else if (filename.startsWith('office-pdf-')) {
      clientFilename = filename.replace(/^office-pdf-\d+-\d+-/, 'converted_document_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('pdf-excel-')) {
      clientFilename = filename.replace(/^pdf-excel-\d+-\d+-/, 'extracted_table_');
      if (!clientFilename.endsWith('.xlsx')) clientFilename += '.xlsx';
    } else if (filename.startsWith('unlocked-')) {
      clientFilename = filename.replace(/^unlocked-\d+-\d+-/, 'unlocked_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    }

    res.download(filePath, clientFilename, (err) => {
      if (err) {
        console.error(`Error downloading file ${filename}:`, err);
      }
    });
  } else {
    res.status(404).json({ error: 'File not found or link expired.' });
  }
});

module.exports = router;
