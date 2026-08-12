const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { jobs, upload, COMPRESSED_DIR, execGhostscript } = require('./config');

// Helper for async file deletion
const safelyDeleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to delete file ${filePath}:`, err);
    }
  }
};

router.post('/protect', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const password = req.body.password;
  if (!password) {
    await safelyDeleteFile(req.file.path);
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
    await safelyDeleteFile(inputPath);

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
      const stats = await fs.promises.stat(outputPath);
      jobs[jobId] = {
        status: 'completed',
        originalName: originalName,
        protectedSize: stats.size,
        downloadUrl: `/api/download/${protectedFilename}`,
        timestamp: Date.now()
      };
    } catch (statErr) {
      if (statErr.code === 'ENOENT') {
        jobs[jobId] = {
          status: 'error',
          error: 'Protected file was not generated.',
          timestamp: Date.now()
        };
      } else {
        console.error(`[ERROR] Stat failed for protected file ${outputPath}:`, statErr);
        jobs[jobId] = {
          status: 'error',
          error: 'Failed to read generated protected file.',
          timestamp: Date.now()
        };
      }
    }
  });
});

module.exports = router;
