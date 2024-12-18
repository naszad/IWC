const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'misc';
    const dir = path.join(__dirname, '..', 'uploads', type);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const type = req.body.type;
  
  if (type === 'image') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
  } else if (type === 'audio') {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed!'), false);
    }
  } else {
    return cb(new Error('Invalid file type specified'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size cannot exceed 10MB'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      error: 'Invalid file',
      message: err.message
    });
  }
  
  next();
};

// Upload endpoint
router.post('/upload', auth, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/${req.body.type}/${req.file.filename}`;

    res.json({
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

module.exports = router; 