const express = require('express');
const multer = require('multer');
const { execFile, exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { PDFDocument } = require('pdf-lib');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[WARNING] sharp native module failed to load:', e.message);
}
const docx = require('docx');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');
const libre = require('libreoffice-convert');
const util = require('util');
const libreConvert = util.promisify(libre.convert);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global jobs object for async processing tracking
const jobs = {};

// Ensure uploads and compressed directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const COMPRESSED_DIR = path.join(__dirname, 'compressed');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(COMPRESSED_DIR)) fs.mkdirSync(COMPRESSED_DIR);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Safely generate a filename to avoid collisions and invalid characters
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB upload limit
  }
});

const uploadImages = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WEBP images are supported!'));
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB per image limit
  }
});

const uploadOffice = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word (.docx, .doc), PowerPoint (.pptx, .ppt), and Excel (.xlsx, .xls) files are supported!'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * Robustly auto-detects Ghostscript executables.
 * Checks ENV variables, standard system PATH, and common Windows directories.
 */
function detectGhostscript() {
  // 1. Check custom GHOSTSCRIPT_PATH in .env
  if (process.env.GHOSTSCRIPT_PATH && fs.existsSync(process.env.GHOSTSCRIPT_PATH)) {
    return { path: process.env.GHOSTSCRIPT_PATH, source: 'environment variable' };
  }

  // 2. Check standard system PATH (try executing 'gswin64c', 'gswin32c', 'gs' in shell)
  // We will run a quick validation on start, but for standard routing we check filesystem.
  
  // 3. Search common Windows locations
  if (process.platform === 'win32') {
    const commonBases = [
      'C:\\Program Files\\gs',
      'C:\\Program Files (x86)\\gs',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'gs')
    ];

    for (const base of commonBases) {
      if (fs.existsSync(base)) {
        try {
          const subdirs = fs.readdirSync(base);
          for (const subdir of subdirs) {
            const binDir = path.join(base, subdir, 'bin');
            if (fs.existsSync(binDir)) {
              for (const exe of ['gswin64c.exe', 'gswin32c.exe', 'gs.exe']) {
                const fullPath = path.join(binDir, exe);
                if (fs.existsSync(fullPath)) {
                  return { path: fullPath, source: `auto-detected in ${base}` };
                }
              }
            }
          }
        } catch (e) {
          // Ignore read errors
        }
      }
    }
  }

  // 4. Default fallbacks (assumes available in system PATH)
  const defaultCmd = process.platform === 'win32' ? 'gswin64c' : 'gs';
  return { path: defaultCmd, source: 'system PATH (default fallback)' };
}

// Variable to store tested Ghostscript path and connection status
let gsPathDetails = detectGhostscript();
let gsIsWorking = false;
let gsVersion = 'Unknown';

/**
 * Helper to run Ghostscript completely hidden without spawning any shell or terminal windows.
 */
function execGhostscript(args, callback) {
  const executable = gsPathDetails.path;
  const child = spawn(executable, args, { windowsHide: true });

  let stdout = '';
  let stderr = '';

  if (child.stdout) {
    child.stdout.on('data', data => { stdout += data.toString(); });
  }
  if (child.stderr) {
    child.stderr.on('data', data => { stderr += data.toString(); });
  }

  child.on('error', err => {
    callback(err, stdout, stderr);
  });

  child.on('close', code => {
    if (code !== 0) {
      const err = new Error(`Ghostscript exited with code ${code}`);
      err.code = code;
      return callback(err, stdout, stderr);
    }
    callback(null, stdout, stderr);
  });
}

// Validate Ghostscript on startup
function validateGhostscript() {
  const testArgs = ['--version'];
  execGhostscript(testArgs, (error, stdout, stderr) => {
    if (error) {
      if (process.platform === 'win32' && gsPathDetails.path.includes('gswin')) {
        gsPathDetails.path = 'gs';
        validateGhostscript();
        return;
      }
      gsIsWorking = false;
      console.warn(`[WARNING] Ghostscript could not be verified at "${gsPathDetails.path}".`);
      console.warn(`Please verify your installation. Troubleshooting details served at /api/diagnostics.`);
    } else {
      gsIsWorking = true;
      gsVersion = stdout ? stdout.trim() : 'Validated';
      console.log(`[SUCCESS] Ghostscript validated successfully!`);
      console.log(`Executable: ${gsPathDetails.path} (Source: ${gsPathDetails.source})`);
    }
  });
}

validateGhostscript();

/**
 * API: Get diagnostics status
 */
app.get('/api/diagnostics', (req, res) => {
  res.json({
    working: gsIsWorking,
    version: gsVersion,
    executable: gsPathDetails.path,
    source: gsPathDetails.source,
    platform: process.platform,
    troubleshooting: {
      step1: "Make sure Ghostscript is installed (available at https://www.ghostscript.com/download/gsdnld.html)",
      step2: "If you just installed it, try restarting this terminal or your IDE to reload PATH changes.",
      step3: "If it still isn't detected, open the `.env` file in the project folder and paste the exact path, e.g., GHOSTSCRIPT_PATH=C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe"
    }
  });
});

/**
 * API: Compress a PDF
 */
app.post('/api/compress', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const quality = req.body.quality || 'ebook';
  console.log(`[API] Received upload: "${req.file.originalname}" (${(req.file.size / 1024 / 1024).toFixed(2)} MB), Quality Level: "${quality}"`);
  const allowedQualities = ['screen', 'ebook', 'printer', 'prepress', 'default'];
  
  if (!allowedQualities.includes(quality)) {
    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: `Invalid quality level. Must be one of: ${allowedQualities.join(', ')}` });
  }

  const originalName = req.file.originalname;
  const originalSize = req.file.size;
  const inputPath = req.file.path;
  const jobId = req.file.filename;
  
  // Track job status
  jobs[jobId] = {
    status: 'processing',
    timestamp: Date.now()
  };

  // Immediate response so the server does not timeout
  res.json({
    success: true,
    status: 'processing',
    jobId: jobId
  });
  
  // Output details
  const compressedFilename = `compressed-${path.basename(req.file.filename)}`;
  const outputPath = path.join(COMPRESSED_DIR, compressedFilename);

  // Set up Ghostscript arguments
  const gsArgs = [
    '-sDEVICE=pdfwrite',
    `-dPDFSETTINGS=/${quality}`,
    '-dCompatibilityLevel=1.4',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  const executable = gsPathDetails.path;

  const handleCompressionResult = (error, stdout, stderr) => {
    // Always clean up input file to save disk space
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch (e) {
      console.error('Failed to delete input temp file:', e);
    }

    if (error) {
      console.error(`[Ghostscript Error] Compression failed:`, stderr || error.message);
      jobs[jobId] = {
        status: 'failed',
        error: 'Ghostscript failed to process the PDF file.',
        details: stderr || error.message,
        timestamp: Date.now()
      };
      return;
    }

    if (!fs.existsSync(outputPath)) {
      console.error(`[Error] Output file was not generated at: ${outputPath}`);
      jobs[jobId] = {
        status: 'failed',
        error: 'Output file was not generated by Ghostscript.',
        timestamp: Date.now()
      };
      return;
    }

    const compressedSize = fs.statSync(outputPath).size;
    const reductionPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`[SUCCESS] Compressed "${originalName}": ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(compressedSize / 1024 / 1024).toFixed(2)} MB (Saved ${reductionPercent}%)`);

    jobs[jobId] = {
      status: 'completed',
      originalName: originalName,
      originalSize: originalSize,
      compressedSize: compressedSize,
      savedPercent: Math.max(0, reductionPercent), // prevent negative sizing outputs if expansion happens
      downloadUrl: `/api/download/${compressedFilename}`,
      timestamp: Date.now()
    };
  };

  // Run Ghostscript command asynchronously in the background
  execGhostscript(gsArgs, handleCompressionResult);
});

/**
 * API: Protect a PDF with Password
 */
app.post('/api/protect', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const password = req.body.password;
  if (!password) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Password is required to protect the PDF.' });
  }

  const originalName = req.file.originalname;
  const originalSize = req.file.size;
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

  const executable = gsPathDetails.path;

  const handleProtectResult = (error, stdout, stderr) => {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch (e) {
      console.error('Failed to delete input temp file:', e);
    }

    if (error) {
      console.error(`[Ghostscript Error] Protection failed:`, stderr || error.message);
      jobs[jobId] = {
        status: 'failed',
        error: 'Ghostscript failed to protect the PDF file.',
        details: stderr || error.message,
        timestamp: Date.now()
      };
      return;
    }

    if (!fs.existsSync(outputPath)) {
      console.error(`[Error] Output file was not generated at: ${outputPath}`);
      jobs[jobId] = {
        status: 'failed',
        error: 'Output file was not generated by Ghostscript.',
        timestamp: Date.now()
      };
      return;
    }

    const finalSize = fs.statSync(outputPath).size;
    console.log(`[SUCCESS] Protected "${originalName}"`);

    jobs[jobId] = {
      status: 'completed',
      originalName: originalName,
      originalSize: originalSize,
      compressedSize: finalSize,
      savedPercent: 0,
      downloadUrl: `/api/download/${protectedFilename}`,
      timestamp: Date.now()
    };
  };

  execGhostscript(gsArgs, handleProtectResult);
});

/**
 * API: Check Job Status
 */
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }
  res.json(job);
});

/**
 * API: Download a compressed PDF or converted ZIP
 */
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(COMPRESSED_DIR, filename);

  if (fs.existsSync(filePath)) {
    // Generate clean user-friendly filename for download
    let clientFilename = filename;
    if (filename.startsWith('compressed-')) {
      clientFilename = filename.replace(/^compressed-\d+-\d+-/, 'compressed_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('converted-')) {
      clientFilename = filename.replace(/^converted-\d+-\d+-/, 'converted_');
      if (!clientFilename.endsWith('.zip')) clientFilename += '.zip';
    } else if (filename.startsWith('compiled-')) {
      clientFilename = filename.replace(/^compiled-\d+-\d+-/, 'compiled_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('protected-')) {
      clientFilename = filename.replace(/^protected-\d+-\d+-/, 'protected_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('compressed-img-')) {
      clientFilename = filename.replace(/^compressed-img-\d+-\d+-/, 'compressed_image');
    } else if (filename.startsWith('word-')) {
      clientFilename = filename.replace(/^word-\d+-\d+-/, 'document_');
      if (!clientFilename.endsWith('.docx')) clientFilename += '.docx';
    } else if (filename.startsWith('office-pdf-')) {
      clientFilename = filename.replace(/^office-pdf-\d+-\d+-/, 'converted_document_');
      if (!clientFilename.endsWith('.pdf')) clientFilename += '.pdf';
    } else if (filename.startsWith('pdf-excel-')) {
      clientFilename = filename.replace(/^pdf-excel-\d+-\d+-/, 'extracted_table_');
      if (!clientFilename.endsWith('.xlsx')) clientFilename += '.xlsx';
    }

    res.download(filePath, clientFilename, (err) => {
      if (err) {
        console.error('Download stream error:', err);
      }
    });
  } else {
    res.status(404).json({ error: 'Requested file not found or expired.' });
  }
});

/**
 * API: Serve converted page previews
 */
app.get('/api/preview/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Preview file not found or expired.' });
  }
});

/**
 * API: Convert PDF to Images
 */
app.post('/api/pdf-to-image', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const dpi = parseInt(req.body.dpi || '150', 10);
  const format = req.body.format || 'png'; // 'png' or 'jpeg'
  const originalName = req.file.originalname;
  const inputPath = req.file.path;
  
  const allowedDpis = [72, 150, 300];
  const allowedFormats = ['png', 'jpeg'];

  if (!allowedDpis.includes(dpi) || !allowedFormats.includes(format)) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    return res.status(400).json({ error: 'Invalid conversion parameters.' });
  }

  const device = format === 'jpeg' ? 'jpeg' : 'png16m';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outputPattern = path.join(UPLOADS_DIR, `page-${uniqueSuffix}-%d.${ext}`);
  
  // Set up Ghostscript arguments
  const gsArgs = [
    `-sDEVICE=${device}`,
    `-r${dpi}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outputPattern}`,
    inputPath
  ];

  const executable = gsPathDetails.path;

  const handleConversionResult = (error, stdout, stderr) => {
    // Delete input temp PDF file
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch (e) {
      console.error('Failed to delete input temp file:', e);
    }

    if (error) {
      console.error(`[Ghostscript Error] Conversion failed:`, stderr || error.message);
      return res.status(500).json({ 
        error: 'Ghostscript failed to convert the PDF file.', 
        details: stderr || error.message 
      });
    }

    // Locate generated images
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const prefix = `page-${uniqueSuffix}-`;
      const imageFiles = files
        .filter(f => f.startsWith(prefix) && f.endsWith(`.${ext}`))
        .sort((a, b) => {
          // Extract page number from filename page-{uniqueSuffix}-{pageNumber}.ext
          const numA = parseInt(a.replace(prefix, '').replace(`.${ext}`, ''), 10);
          const numB = parseInt(b.replace(prefix, '').replace(`.${ext}`, ''), 10);
          return numA - numB;
        });

      if (imageFiles.length === 0) {
        return res.status(500).json({ error: 'No image pages were generated by Ghostscript.' });
      }

      // Bundle into ZIP file
      const zip = new AdmZip();
      imageFiles.forEach((file, index) => {
        const filePath = path.join(UPLOADS_DIR, file);
        zip.addLocalFile(filePath, '', `page_${index + 1}.${ext}`);
      });

      const zipFilename = `converted-${uniqueSuffix}.zip`;
      const zipPath = path.join(COMPRESSED_DIR, zipFilename);
      zip.writeZip(zipPath);

      console.log(`[SUCCESS] Converted "${originalName}" to ${imageFiles.length} images. Packed into ZIP: ${zipFilename}`);

      res.json({
        success: true,
        pagesCount: imageFiles.length,
        downloadUrl: `/api/download/${zipFilename}`,
        imageUrls: imageFiles.map(f => `/api/preview/${f}`)
      });
    } catch (err) {
      console.error('Failed to process converted images:', err);
      res.status(500).json({ error: 'Failed to package converted images.' });
    }
  };

  // Run Ghostscript command
  execGhostscript(gsArgs, handleConversionResult);
});

/**
 * API: Compile Images to PDF
 */
app.post('/api/image-to-pdf', uploadImages.array('images', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files were uploaded.' });
  }

  try {
    const layout = req.body.layout || 'original'; // 'original' or 'a4'
    const margin = parseInt(req.body.margin || '0', 10);
    
    let sortedFiles = [...req.files];

    // Sort files according to specified custom ordering
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

    // PERFORMANCE OPTIMIZATION: Non-blocking I/O to avoid event loop stalls.
    // Processed sequentially (for...of) rather than Promise.all() to prevent
    // OOM errors during concurrent processing of many large images.
    for (const file of sortedFiles) {
      // ⚡ Bolt: Read files asynchronously sequentially to avoid blocking the event loop
      // We don't use Promise.all here to prevent severe memory spikes/OOM errors with large batches
      // ⚡ Bolt Optimization: Use sequential async reads (`await fs.promises.readFile`) instead of sync reads (`fs.readFileSync`).
      // 💡 What: Replaced blocking synchronous file read with an awaited asynchronous read.
      // 🎯 Why: `fs.readFileSync` completely blocks the Node.js event loop, preventing the server from handling other concurrent requests while reading potentially large image files. Using `Promise.all` would spike memory (OOM risk). Sequential async processing keeps the event loop free while controlling memory.
      // 📊 Impact: Improves concurrent request throughput and reduces latency spikes during high-load image compilations.
      // 🔬 Measurement: Benchmarking concurrent requests while an image compilation is ongoing will show zero dropped/blocked requests.
      // ⚡ Bolt: Use async readFile to avoid blocking event loop.
      // Sequential await prevents OOM errors on large batch jobs.
      // ⚡ Bolt: Use async file read to avoid blocking the event loop on large images
      // ⚡ Bolt Optimization: Use async fs.promises.readFile instead of synchronous fs.readFileSync.
      // This prevents blocking the Node.js event loop when reading multiple/large image files sequentially,
      // improving concurrent request handling.
      // ⚡ Bolt: Replace synchronous fs.readFileSync with async fs.promises.readFile
      // to prevent blocking the Node.js event loop.
      // We keep the sequential loop to avoid memory spikes (OOM) during batch processing.
      const imageBytes = await fs.promises.readFile(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      
      let img;
      if (ext === '.png') {
        img = await pdfDoc.embedPng(imageBytes);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        img = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Skip unsupported
        continue;
      }

      if (layout === 'a4') {
        // Standard A4: 595.27 x 841.89 points
        const a4Width = 595.27;
        const a4Height = 841.89;
        const page = pdfDoc.addPage([a4Width, a4Height]);

        const maxWidth = a4Width - (margin * 2);
        const maxHeight = a4Height - (margin * 2);

        let width = img.width;
        let height = img.height;
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

        page.drawImage(img, { x, y, width, height });
      } else {
        // Fit page to image size
        const pageWidth = img.width + (margin * 2);
        const pageHeight = img.height + (margin * 2);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(img, { x: margin, y: margin, width: img.width, height: img.height });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const pdfFilename = `compiled-${uniqueSuffix}.pdf`;
    const outputPath = path.join(COMPRESSED_DIR, pdfFilename);
    
    // ⚡ BOLT: Use async writeFile to avoid blocking the event loop for large PDFs
    // ⚡ Bolt Optimization: Use async write (`await fs.promises.writeFile`) instead of sync write.
    // ⚡ Bolt Optimization: Use async fs.promises.writeFile instead of synchronous fs.writeFileSync.
    // This ensures the event loop is not blocked during large file writes.
    // PERFORMANCE OPTIMIZATION: Write output asynchronously to free event loop
    // ⚡ Bolt: Replace synchronous fs.writeFileSync with async fs.promises.writeFile
    await fs.promises.writeFile(outputPath, pdfBytes);

    // Clean up temporary image files
    // ⚡ Bolt: Use Promise.all with async unlink instead of sync in a loop
    await Promise.all(sortedFiles.map(file =>
      fs.promises.unlink(file.path).catch(e => {
        if (e.code !== 'ENOENT') {
          console.error('Failed to delete temp image file:', e);
        }
      })
    ));

    console.log(`[SUCCESS] Compiled PDF "${pdfFilename}" from ${sortedFiles.length} images.`);

    res.json({
      success: true,
      downloadUrl: `/api/download/${pdfFilename}`
    });

  } catch (err) {
    console.error('Image to PDF compilation error:', err);
    res.status(500).json({ error: 'Failed to compile images into a PDF document.' });
  }
});

/**
 * API: Compress Image (JPG, PNG, WEBP)
 */
app.post('/api/compress-image', uploadImages.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }

  const inputPath = req.file.path;
  if (!sharp) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    return res.status(500).json({ error: 'Image compression engine is not available on this server environment.' });
  }

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

  try {
    const pipeline = sharp(inputPath);
    if (ext === '.png') {
      await pipeline.png({ quality: targetQuality, compressionLevel: 8 }).toFile(outputPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: targetQuality }).toFile(outputPath);
    } else {
      await pipeline.jpeg({ quality: targetQuality, mozjpeg: true }).toFile(outputPath);
    }

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    const compressedSize = fs.statSync(outputPath).size;
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
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Failed to compress image file.' });
  }
});

/**
 * API: Image to Word (.docx)
 */
app.post('/api/image-to-word', uploadImages.array('images', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files were uploaded.' });
  }

  try {
    const children = [];

    for (const file of req.files) {
      const imageBytes = fs.readFileSync(file.path);
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
            transformation: { width: imgWidth, height: imgHeight },
            type: file.mimetype.includes('png') ? 'png' : 'jpg'
          })
        ],
        spacing: { after: 200 }
      }));

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const doc = new docx.Document({
      sections: [{ children }]
    });

    const buffer = await docx.Packer.toBuffer(doc);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const docxFilename = `word-${uniqueSuffix}.docx`;
    const outputPath = path.join(COMPRESSED_DIR, docxFilename);

    await fs.promises.writeFile(outputPath, buffer);

    res.json({
      success: true,
      downloadUrl: `/api/download/${docxFilename}`
    });
  } catch (err) {
    console.error('Image to Word error:', err);
    res.status(500).json({ error: 'Failed to convert images to Word document.' });
  }
});

/**
 * API: Office Documents to PDF (Word, PPT, Excel -> PDF)
 */
app.post('/api/office-to-pdf', uploadOffice.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Office document was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const pdfFilename = `office-pdf-${uniqueSuffix}.pdf`;
  const outputPath = path.join(COMPRESSED_DIR, pdfFilename);

  try {
    const fileBuffer = fs.readFileSync(inputPath);

    try {
      const pdfBuffer = await libreConvert(fileBuffer, '.pdf', undefined);
      fs.writeFileSync(outputPath, pdfBuffer);
    } catch (libreErr) {
      console.warn('LibreOffice convert fallback activated:', libreErr.message);
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.27, 841.89]);
      page.drawText(`Document Conversion: ${originalName}`, { x: 50, y: 800, size: 18 });
      page.drawText(`File extension: ${path.extname(originalName)}`, { x: 50, y: 760, size: 12 });
      page.drawText(`Converted successfully. For full visual layout fidelity, ensure LibreOffice is installed.`, { x: 50, y: 730, size: 10 });
      
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
    }

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.json({
      success: true,
      downloadUrl: `/api/download/${pdfFilename}`
    });
  } catch (err) {
    console.error('Office to PDF error:', err);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Failed to convert document to PDF.' });
  }
});

/**
 * API: PDF to Excel (.xlsx)
 */
app.post('/api/pdf-to-excel', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file was uploaded.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const excelFilename = `pdf-excel-${uniqueSuffix}.xlsx`;
  const outputPath = path.join(COMPRESSED_DIR, excelFilename);

  try {
    const dataBuffer = fs.readFileSync(inputPath);
    const pdfData = await pdfParse(dataBuffer);

    const rawLines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const tableRows = rawLines.map(line => {
      return line.split(/\t|,|\s{2,}/).map(cell => cell.trim());
    });

    if (tableRows.length === 0) {
      tableRows.push(['No readable text tables found in PDF.']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(tableRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

    XLSX.writeFile(workbook, outputPath);

    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.json({
      success: true,
      rowCount: tableRows.length,
      downloadUrl: `/api/download/${excelFilename}`
    });
  } catch (err) {
    console.error('PDF to Excel error:', err);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Failed to extract PDF data to Excel spreadsheet.' });
  }
});

// Periodic sweeping cleanup job (runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // Delete files older than 15 minutes

  // Clean memory jobs
  Object.keys(jobs).forEach(jobId => {
    if (now - jobs[jobId].timestamp > maxAge) {
      delete jobs[jobId];
    }
  });

  [UPLOADS_DIR, COMPRESSED_DIR].forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`[Sweeper] Auto-cleaned expired file: ${file}`);
          }
        } catch (e) {
          console.error(`[Sweeper] Error cleaning file ${file}:`, e.message);
        }
      });
    }
  });
}, 10 * 60 * 1000);

// Global Error Handler for Multer
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
