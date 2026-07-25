const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { jobs, upload, COMPRESSED_DIR, execGhostscript } = require('./config');

router.post('/protect', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const password = req.body.password;
  if (!password) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Password is required to protect the PDF.' });
  }

  const originalName = req.file.originalname;
  const inputPath = req.file.path;
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
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOwnerPassword=${password}`,
    `-sUserPassword=${password}`,
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  execGhostscript(gsArgs, (err) => {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

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

    const protectedSize = fs.statSync(outputPath).size;

    jobs[jobId] = {
      status: 'completed',
      originalName: originalName,
      protectedSize: protectedSize,
      downloadUrl: `/api/download/${protectedFilename}`,
      timestamp: Date.now()
    };
  });
});

module.exports = router;
