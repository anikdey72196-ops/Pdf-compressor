const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');

// Directories
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const COMPRESSED_DIR = path.join(__dirname, '..', 'compressed');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(COMPRESSED_DIR)) fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

// Global jobs object for async tracking
const jobs = {};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// PDF upload middleware
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Image upload middleware
const uploadImages = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) are supported!'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Office documents upload middleware
const uploadOffice = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word, PowerPoint, and Excel files are supported!'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Ghostscript Binary Auto-Detection
let GHOSTSCRIPT_PATH = process.env.GHOSTSCRIPT_PATH || null;
let ghostscriptSource = GHOSTSCRIPT_PATH ? 'environment variable' : 'not detected';

function detectGhostscript() {
  if (GHOSTSCRIPT_PATH && fs.existsSync(GHOSTSCRIPT_PATH)) {
    return true;
  }

  const commonWinPaths = [
    'C:\\Program Files\\gs',
    'C:\\Program Files (x86)\\gs'
  ];

  for (const basePath of commonWinPaths) {
    if (fs.existsSync(basePath)) {
      try {
        const versions = fs.readdirSync(basePath);
        for (const ver of versions) {
          const binPath = path.join(basePath, ver, 'bin');
          if (fs.existsSync(binPath)) {
            const possibleExes = ['gswin64c.exe', 'gswin32c.exe', 'gs.exe'];
            for (const exe of possibleExes) {
              const fullPath = path.join(binPath, exe);
              if (fs.existsSync(fullPath)) {
                GHOSTSCRIPT_PATH = fullPath;
                ghostscriptSource = `auto-detected in ${basePath}`;
                return true;
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  GHOSTSCRIPT_PATH = 'gs';
  ghostscriptSource = 'fallback PATH executable';
  return false;
}

const isGsInstalled = detectGhostscript();

function getGsDiagnosticInfo() {
  return {
    installed: isGsInstalled,
    executable: GHOSTSCRIPT_PATH,
    source: ghostscriptSource
  };
}

function execGhostscript(args, callback) {
  const binary = GHOSTSCRIPT_PATH || 'gs';
  const child = spawn(binary, args, { windowsHide: true });

  let stderr = '';

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('error', (err) => {
    callback(err, null, stderr);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      return callback(new Error(`Ghostscript exited with code ${code}: ${stderr}`), null, stderr);
    }
    callback(null, 'Success', stderr);
  });
}

module.exports = {
  UPLOADS_DIR,
  COMPRESSED_DIR,
  jobs,
  upload,
  uploadImages,
  uploadOffice,
  execGhostscript,
  getGsDiagnosticInfo
};
