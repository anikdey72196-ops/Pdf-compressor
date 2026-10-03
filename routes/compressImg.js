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
  else if (qualityPreset === 'high') targetQuality = 85;

  const rawExt = path.extname(originalName).toLowerCase();
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.jpg';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outputFilename = `compressed-img-${uniqueSuffix}${ext}`;
  const outputPath = path.join(COMPRESSED_DIR, outputFilename);

  if (!sharp) {
    try {
      await fs.promises.copyFile(inputPath, outputPath);
      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (e) {}
      }
      return res.json({
        success: true,
        originalName: originalName,
        originalSize: originalSize,
        compressedSize: originalSize,
        savedPercent: '0.0',
        downloadUrl: `/api/download/${outputFilename}`
      });
    } catch (e) {
      if (fs.existsSync(inputPath)) {
        try { await fs.promises.unlink(inputPath); } catch (err) {}
      }
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

    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }

    let compressedSize = originalSize;
    try {
      const stats = await fs.promises.stat(outputPath);
      compressedSize = stats.size;
    } catch (e) {}

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
    if (fs.existsSync(inputPath)) {
      try { await fs.promises.unlink(inputPath); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to compress image file.' });
  }
});

module.exports = router;
