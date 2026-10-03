const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { COMPRESSED_DIR, UPLOADS_DIR } = require('./config');

const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$/;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.zip', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.webp']);

function isPathSafe(baseDir, filename) {
  if (!filename || !SAFE_FILENAME_REGEX.test(filename)) return false;
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;

  const resolvedBase = path.resolve(baseDir) + path.sep;
  const resolvedTarget = path.resolve(baseDir, filename);
  return resolvedTarget.startsWith(resolvedBase);
}

router.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);

  if (!isPathSafe(COMPRESSED_DIR, filename)) {
    return res.status(400).json({ error: 'Invalid or unauthorized filename.' });
  }

  const filePath = path.resolve(COMPRESSED_DIR, filename);

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

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(filePath, clientFilename, (err) => {
      if (err) {
        console.error(`Error downloading file ${filename}:`, err.message);
      }
    });
  } else {
    res.status(404).json({ error: 'File not found or link expired.' });
  }
});

router.get('/preview/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);

  const safeInUploads = isPathSafe(UPLOADS_DIR, filename);
  const safeInCompressed = isPathSafe(COMPRESSED_DIR, filename);

  if (!safeInUploads && !safeInCompressed) {
    return res.status(400).json({ error: 'Invalid or unauthorized filename.' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (safeInUploads) {
    const uploadPath = path.resolve(UPLOADS_DIR, filename);
    if (fs.existsSync(uploadPath)) {
      return res.sendFile(uploadPath);
    }
  }

  if (safeInCompressed) {
    const compressedPath = path.resolve(COMPRESSED_DIR, filename);
    if (fs.existsSync(compressedPath)) {
      return res.sendFile(compressedPath);
    }
  }

  res.status(404).json({ error: 'Preview file not found or expired.' });
});

module.exports = router;
