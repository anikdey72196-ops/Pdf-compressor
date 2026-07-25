const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { jobs, upload, COMPRESSED_DIR, execGhostscript } = require('./config');

router.post('/pdf-to-img', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const format = req.body.format || 'png';
  const dpi = req.body.dpi || 150;
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

  const jobTempDir = path.join(COMPRESSED_DIR, `temp-${jobId}`);
  if (!fs.existsSync(jobTempDir)) fs.mkdirSync(jobTempDir, { recursive: true });

  const device = format === 'jpg' ? 'jpeg' : 'pngalpha';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const pageOutputPattern = path.join(jobTempDir, `page-%03d.${ext}`);

  const gsArgs = [
    `-sDEVICE=${device}`,
    `-r${dpi}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${pageOutputPattern}`,
    inputPath
  ];

  execGhostscript(gsArgs, (err) => {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    if (err) {
      console.error(`[ERROR] PDF to Image failed for job ${jobId}:`, err);
      if (fs.existsSync(jobTempDir)) fs.rmSync(jobTempDir, { recursive: true, force: true });
      jobs[jobId] = {
        status: 'error',
        error: err.message || 'PDF to Image conversion failed.',
        timestamp: Date.now()
      };
      return;
    }

    try {
      const pageFiles = fs.readdirSync(jobTempDir).filter(f => f.endsWith(`.${ext}`));
      if (pageFiles.length === 0) {
        if (fs.existsSync(jobTempDir)) fs.rmSync(jobTempDir, { recursive: true, force: true });
        jobs[jobId] = {
          status: 'error',
          error: 'No image pages were rendered from the PDF.',
          timestamp: Date.now()
        };
        return;
      }

      const zipFilename = `converted-${jobId}.zip`;
      const zipPath = path.join(COMPRESSED_DIR, zipFilename);
      const zip = new AdmZip();

      pageFiles.sort().forEach(file => {
        zip.addLocalFile(path.join(jobTempDir, file));
      });

      zip.writeZip(zipPath);
      if (fs.existsSync(jobTempDir)) fs.rmSync(jobTempDir, { recursive: true, force: true });

      const zipSize = fs.statSync(zipPath).size;

      jobs[jobId] = {
        status: 'completed',
        originalName: originalName,
        pageCount: pageFiles.length,
        downloadUrl: `/api/download/${zipFilename}`,
        zipSize: zipSize,
        timestamp: Date.now()
      };
    } catch (zipErr) {
      console.error('ZIP packaging error:', zipErr);
      if (fs.existsSync(jobTempDir)) fs.rmSync(jobTempDir, { recursive: true, force: true });
      jobs[jobId] = {
        status: 'error',
        error: 'Failed to package rendered images into a ZIP archive.',
        timestamp: Date.now()
      };
    }
  });
});

module.exports = router;
