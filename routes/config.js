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

// Storage configuration with sanitized file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = /^\.[a-z0-9]+$/i.test(rawExt) ? rawExt : '';
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});

// PDF upload middleware: Enforce .pdf extension
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are supported!'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Image upload middleware: Enforce strictly allowed image extensions
const uploadImages = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) are supported!'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Office documents upload middleware: Enforce office document extensions
const uploadOffice = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word, PowerPoint, and Excel files are supported!'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Validate that a file actually begins with the %PDF magic header
async function isValidPdfHeader(filePath) {
  let fd;
  try {
    fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(5);
    await fd.read(buffer, 0, 5, 0);
    return buffer.toString('utf-8').startsWith('%PDF');
  } catch (e) {
    return false;
  } finally {
    if (fd) {
      try {
        await fd.close();
      } catch (e) {}
    }
  }
}

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

/**
 * Execute Ghostscript safely.
 * Security guarantees:
 * 1. Enforces -dSAFER to sandbox PostScript execution against unauthorized file/OS access.
 * 2. Implements a process execution timeout (120s) to prevent infinite loop / CPU exhaustion DoS attacks.
 */
function execGhostscript(args, callback) {
  const binary = GHOSTSCRIPT_PATH || 'gs';
  
  // Enforce -dSAFER in Ghostscript arguments
  const safeArgs = args.includes('-dSAFER') ? [...args] : ['-dSAFER', ...args];

  const child = spawn(binary, safeArgs, { windowsHide: true });

  let stderr = '';
  let stdout = '';
  let killed = false;

  // Timeout guard (2 minutes max execution per job)
  const timeoutMs = 120000;
  const timer = setTimeout(() => {
    killed = true;
    try {
      child.kill('SIGKILL');
    } catch (e) {}
  }, timeoutMs);

  if (child.stdout) {
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
  }

  if (child.stderr) {
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
  }

  child.on('error', (err) => {
    clearTimeout(timer);
    callback(err, null, stderr);
  });

  child.on('close', (code) => {
    clearTimeout(timer);
    if (killed) {
      return callback(new Error('Ghostscript process timed out after 120 seconds'), null, stderr);
    }
    if (code !== 0) {
      return callback(new Error(`Ghostscript exited with code ${code}: ${stderr}`), null, stderr);
    }
    callback(null, stdout || 'Success', stderr);
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
  getGsDiagnosticInfo,
  isValidPdfHeader
};
