const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[WARNING] sharp module not available for image-to-pdf format conversion:', e.message);
}
const { uploadImages, COMPRESSED_DIR } = require('./config');

// Support both /image-to-pdf and /img-to-pdf endpoints
router.post(['/image-to-pdf', '/img-to-pdf'], uploadImages.array('images', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files were uploaded.' });
  }

  try {
    const layout = req.body.layout || 'original'; // 'original' or 'a4'
    const margin = parseInt(req.body.margin || '0', 10);

    let sortedFiles = [...req.files];

    // Sort files according to specified custom ordering if provided
    if (req.body.order) {
      try {
        const orderList = JSON.parse(req.body.order);
        sortedFiles.sort((a, b) => {
          const indexA = orderList.indexOf(a.originalname);
          const indexB = orderList.indexOf(b.originalname);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } catch (err) {
        console.error('Failed to sort images with custom order list:', err);
      }
    }

    const pdfDoc = await PDFDocument.create();

    // Process sequentially to keep memory usage bounded while using async I/O
    for (const file of sortedFiles) {
      const imageBytes = await fs.promises.readFile(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      let image;

      try {
        if (ext === '.png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (ext === '.jpg' || ext === '.jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (sharp) {
          // Convert WebP or other formats to PNG buffer for pdf-lib
          const convertedPng = await sharp(imageBytes).png().toBuffer();
          image = await pdfDoc.embedPng(convertedPng);
        } else {
          // Fallback attempt to embed as JPEG
          try {
            image = await pdfDoc.embedJpg(imageBytes);
          } catch (embedErr) {
            image = await pdfDoc.embedPng(imageBytes);
          }
        }
      } catch (embedError) {
        console.error(`Failed to embed image ${file.originalname}:`, embedError);
        continue;
      }

      if (layout === 'a4') {
        // Standard A4: 595.27 x 841.89 points
        const a4Width = 595.27;
        const a4Height = 841.89;
        const page = pdfDoc.addPage([a4Width, a4Height]);

        const maxWidth = a4Width - (margin * 2);
        const maxHeight = a4Height - (margin * 2);

        let width = image.width;
        let height = image.height;
        const ratio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }

        const x = margin + (maxWidth - width) / 2;
        const y = margin + (maxHeight - height) / 2;

        page.drawImage(image, { x, y, width, height });
      } else {
        // Fit page to image size
        const pageWidth = image.width + (margin * 2);
        const pageHeight = image.height + (margin * 2);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(image, { x: margin, y: margin, width: image.width, height: image.height });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const compiledFilename = `compiled-${uniqueSuffix}.pdf`;
    const outputPath = path.join(COMPRESSED_DIR, compiledFilename);

    await fs.promises.writeFile(outputPath, pdfBytes);

    // Clean up temporary image files
    await Promise.all(sortedFiles.map(file =>
      fs.promises.unlink(file.path).catch(e => {
        if (e.code !== 'ENOENT') console.error(`Error deleting temp file ${file.path}:`, e);
      })
    ));

    console.log(`[SUCCESS] Compiled PDF "${compiledFilename}" from ${sortedFiles.length} images.`);

    res.json({
      success: true,
      imageCount: sortedFiles.length,
      pdfSize: pdfBytes.length,
      downloadUrl: `/api/download/${compiledFilename}`
    });
  } catch (err) {
    console.error('Image to PDF error:', err);
    await Promise.all((req.files || []).map(file =>
      fs.promises.unlink(file.path).catch(e => {
        if (e.code !== 'ENOENT') console.error(`Error cleaning up file ${file.path}:`, e);
      })
    ));
    res.status(500).json({ error: 'Failed to compile images into PDF.' });
  }
});

module.exports = router;
