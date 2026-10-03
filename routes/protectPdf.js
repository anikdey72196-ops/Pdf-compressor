const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { jobs, upload, COMPRESSED_DIR, execGhostscript, isValidPdfHeader } = require('./config');

router.post('/protect', upload.single('pdf'), async (req, res) => {
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

  // Validate password: must be string, length 1-128, no newlines/null bytes to prevent argument injection
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!password || password.length === 0 || password.length > 128 || /[\r\n\0]/.test(password)) {
    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }
    return res.status(400).json({ error: 'A valid password (1-128 characters, without control characters) is required.' });
  }

  const originalName = req.file.originalname;
  const jobId = req.file.filename;

  jobs[jobId] = {
    status: 'processing',
    timestamp: Date.now()
  };

  res.json({
    success: true,
    status: 'processing',
    jobId: jobId
  });

  const protectedFilename = `protected-${path.basename(req.file.filename)}`;
  const outputPath = path.join(COMPRESSED_DIR, protectedFilename);

  const gsArgs = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    '-dSAFER',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOwnerPassword=${password}`,
    `-sUserPassword=${password}`,
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  execGhostscript(gsArgs, (err) => {
    if (fs.existsSync(inputPath)) {
      try { fs.unlinkSync(inputPath); } catch (e) {}
    }

    if (err) {
      console.error(`[ERROR] Protect PDF failed for job ${jobId}:`, err);
      jobs[jobId] = {
        status: 'error',
        error: err.message || 'Protect PDF failed.',
        timestamp: Date.now()
      };
      return;
    }

    if (!fs.existsSync(outputPath)) {
      jobs[jobId] = {
        status: 'error',
        error: 'Protected file was not generated.',
        timestamp: Date.now()
      };
      return;
    }

    try {
      const protectedSize = fs.statSync(outputPath).size;
      jobs[jobId] = {
        status: 'completed',
        originalName: originalName,
        protectedSize: protectedSize,
        downloadUrl: `/api/download/${protectedFilename}`,
        timestamp: Date.now()
      };
    } catch (statErr) {
      console.error(`[ERROR] Failed to stat protected file for job ${jobId}:`, statErr);
      jobs[jobId] = {
        status: 'error',
        error: 'Failed to access protected output file.',
        timestamp: Date.now()
      };
    }
  });
});

module.exports = router;
