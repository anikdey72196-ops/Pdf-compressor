const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const { UPLOADS_DIR, COMPRESSED_DIR, jobs } = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit Ads.txt route for AdSense crawler optimization
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'public', 'ads.txt'));
});

// Body Parser & Static Files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount Modular Tool Routers
app.use('/api', require('./routes/compressPdf'));
app.use('/api', require('./routes/compressImg'));
app.use('/api', require('./routes/pdfToImg'));
app.use('/api', require('./routes/imgToPdf'));
app.use('/api', require('./routes/imgToWord'));
app.use('/api', require('./routes/officeToPdf'));
app.use('/api', require('./routes/pdfToExcel'));
app.use('/api', require('./routes/protectPdf'));
app.use('/api', require('./routes/unlockPdf'));
app.use('/api', require('./routes/download'));

// Periodic Sweeper Cleanup Job (10 mins)
// ⚡ Bolt Optimization: Use async fs.promises to avoid blocking the event loop
setInterval(async () => {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000;

  Object.keys(jobs).forEach(jobId => {
    if (now - jobs[jobId].timestamp > maxAge) {
      delete jobs[jobId];
    }
  });

  for (const dir of [UPLOADS_DIR, COMPRESSED_DIR]) {
    try {
      await fs.promises.access(dir);
      const files = await fs.promises.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          if (now - stats.mtimeMs > maxAge) {
            await fs.promises.unlink(filePath);
            console.log(`[Sweeper] Auto-cleaned expired file: ${file}`);
          }
        } catch (e) {
          console.error(`[Sweeper] Error cleaning file ${file}:`, e.message);
        }
      }
    } catch (err) {
      // Ignore if directory doesn't exist
      if (err.code !== 'ENOENT') {
        console.error(`[Sweeper] Error accessing directory ${dir}:`, err.message);
      }
    }
  }
}, 10 * 60 * 1000);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Max limit is 100MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  PDF COMPRESSOR ENGINE RUNNING                  `);
  console.log(`  Local server: http://localhost:${PORT}        `);
  console.log(`=================================================`);
});
