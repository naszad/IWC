import express, { Request, Response } from 'express';
import { upload } from '../controllers/upload';
import { authenticate } from '../middleware/auth';
import path from 'path';

const router = express.Router();

/**
 * Route for uploading a single file
 * @route POST /api/upload/single
 * @access Private
 */
router.post('/single', authenticate, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }
    
    // Get the server URL
    const protocol = req.protocol;
    const host = req.get('host');
    
    // Generate a URL that aligns with the static file serving configuration
    // The URL should point to /uploads/filename rather than the full file path
    const fileName = path.basename(req.file.path);
    const fileUrl = `${protocol}://${host}/uploads/${fileName}`;
    
    // File uploaded successfully
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading file' });
  }
});

/**
 * Route for uploading multiple files
 * @route POST /api/upload/multiple
 * @access Private
 */
router.post('/multiple', authenticate, upload.array('files', 5), (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }
    
    // Get the server URL
    const protocol = req.protocol;
    const host = req.get('host');
    
    // Files uploaded successfully
    // Need to typecast since req.files can be different types
    const files = req.files as Express.Multer.File[];
    
    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: files.map(file => {
        const fileName = path.basename(file.path);
        const fileUrl = `${protocol}://${host}/uploads/${fileName}`;
        
        return {
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl
        };
      })
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading files' });
  }
});

export default router; 