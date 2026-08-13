const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[WARNING] sharp native module failed to load:', e.message);
}
const { uploadImages, COMPRESSED_DIR } = require('./config');

router.post('/compress-image', uploadImages.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const originalSize = req.file.size;
  const qualityPreset = req.body.quality || 'medium';
  
  let targetQuality = 60;
  if (qualityPreset === 'low') targetQuality = 30;
  if (qualityPreset === 'high') targetQuality = 85;

  const ext = path.extname(originalName).toLowerCase();
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outputFilename = `compressed-img-${uniqueSuffix}${ext || '.jpg'}`;
  const outputPath = path.join(COMPRESSED_DIR, outputFilename);

  if (!sharp) {
    try {
      // PERFORMANCE: Replace synchronous copyFileSync with async version to avoid blocking event loop
      await fs.promises.copyFile(inputPath, outputPath);
      // PERFORMANCE: Replace synchronous existsSync/unlinkSync with async unlink catching ENOENT to avoid blocking event loop
      try { await fs.promises.unlink(inputPath); } catch (err) { if (err.code !== 'ENOENT') throw err; }
      return res.json({
        success: true,
        originalName: originalName,
        originalSize: originalSize,
        compressedSize: originalSize,
        savedPercent: '0.0',
        downloadUrl: `/api/download/${outputFilename}`
      });
    } catch (e) {
      try { await fs.promises.unlink(inputPath); } catch (err) { if (err.code !== 'ENOENT') console.error(err); }
      return res.status(500).json({ error: 'Failed to process image.' });
    }
  }

  try {
    const pipeline = sharp(inputPath);
    if (ext === '.png') {
      await pipeline.png({ quality: targetQuality, compressionLevel: 8 }).toFile(outputPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: targetQuality }).toFile(outputPath);
    } else {
      await pipeline.jpeg({ quality: targetQuality, mozjpeg: true }).toFile(outputPath);
    }

    try { await fs.promises.unlink(inputPath); } catch (err) { if (err.code !== 'ENOENT') throw err; }

    // PERFORMANCE: Replace synchronous statSync with async stat to avoid blocking event loop
    const compressedSize = (await fs.promises.stat(outputPath)).size;
    const reductionPercent = Math.max(0, ((originalSize - compressedSize) / originalSize * 100)).toFixed(1);

    res.json({
      success: true,
      originalName: originalName,
      originalSize: originalSize,
      compressedSize: compressedSize,
      savedPercent: reductionPercent,
      downloadUrl: `/api/download/${outputFilename}`
    });
  } catch (err) {
    console.error('Image compression error:', err);
    try { await fs.promises.unlink(inputPath); } catch (e) { if (e.code !== 'ENOENT') console.error(e); }
    res.status(500).json({ error: 'Failed to compress image file.' });
  }
});

module.exports = router;
