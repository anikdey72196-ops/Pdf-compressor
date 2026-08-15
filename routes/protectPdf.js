const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { jobs, upload, COMPRESSED_DIR, execGhostscript } = require('./config');

router.post('/protect', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const password = req.body.password;
  if (!password) {
    try { await fs.promises.unlink(req.file.path); } catch (e) { if (e.code !== 'ENOENT') console.error(e); }
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

  execGhostscript(gsArgs, async (err) => {
    try { await fs.promises.unlink(inputPath); } catch (e) { if (e.code !== 'ENOENT') console.error(e); }

    if (err) {
      console.error(`[ERROR] Protect PDF failed for job ${jobId}:`, err);
      jobs[jobId] = {
        status: 'error',
        error: err.message || 'Protect PDF failed.',
        timestamp: Date.now()
      };
      return;
    }

    try {
      await fs.promises.access(outputPath);
    } catch (accessErr) {
      jobs[jobId] = {
        status: 'error',
        error: 'Protected file was not generated.',
        timestamp: Date.now()
      };
      return;
    }

    let protectedSize = 0;
    try {
      const stats = await fs.promises.stat(outputPath);
      protectedSize = stats.size;
    } catch (statErr) {
      console.error(`[ERROR] Failed to stat protected file for job ${jobId}:`, statErr);
      jobs[jobId] = {
        status: 'error',
        error: 'Failed to read generated protected file.',
        timestamp: Date.now()
      };
      return;
    }

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
