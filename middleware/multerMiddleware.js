const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use /tmp on Vercel (read-only filesystem), otherwise ./public/temp/
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const uploadDir = isVercel ? path.join(os.tmpdir(), 'uploads') : './public/temp/';

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure dir exists on each request (serverless may lose /tmp between invocations)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

module.exports = { upload };
