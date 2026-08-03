const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const docx = require('docx');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[WARNING] sharp native module failed to load:', e.message);
}
const { uploadImages, COMPRESSED_DIR } = require('./config');

router.post('/image-to-word', uploadImages.array('images', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files were uploaded.' });
  }

  try {
    const children = [];

    // ⚡ Bolt Optimization: Sequential await for reading images avoids Event Loop blocking
    // while preventing the memory spikes/OOM issues of parallel processing (Promise.all).
    for (const file of req.files) {
      const imageBytes = await fs.promises.readFile(file.path);
      let imgWidth = 500;
      let imgHeight = 600;

      if (sharp) {
        try {
          const metadata = await sharp(file.path).metadata();
          const maxWidth = 550;
          imgWidth = metadata.width || 500;
          imgHeight = metadata.height || 600;
          if (imgWidth > maxWidth) {
            imgHeight = Math.round(imgHeight * (maxWidth / imgWidth));
            imgWidth = maxWidth;
          }
        } catch (e) {}
      }

      children.push(new docx.Paragraph({
        children: [
          new docx.ImageRun({
            data: imageBytes,
            transformation: {
              width: imgWidth,
              height: imgHeight
            }
          })
        ],
        spacing: { after: 300 }
      }));

      // ⚡ Bolt Optimization: Use async unlink to avoid blocking the event loop
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('Cleanup error:', err);
      }
    }

    const doc = new docx.Document({
      sections: [{
        children: children
      }]
    });

    const buffer = await docx.Packer.toBuffer(doc);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const wordFilename = `word-${uniqueSuffix}.docx`;
    const outputPath = path.join(COMPRESSED_DIR, wordFilename);

    await fs.promises.writeFile(outputPath, buffer);

    res.json({
      success: true,
      imageCount: req.files.length,
      downloadUrl: `/api/download/${wordFilename}`
    });
  } catch (err) {
    console.error('Image to Word error:', err);
    // ⚡ Bolt Optimization: Non-blocking cleanup in error handler
    req.files.forEach(file => {
      fs.promises.unlink(file.path).catch(e => {
        if (e.code !== 'ENOENT') console.error('Cleanup error in catch:', e);
      });
    });
    res.status(500).json({ error: 'Failed to convert images to Word document.' });
  }
});

module.exports = router;
