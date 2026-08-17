const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../controllers/upload.controller');
const { upload } = require('../middlewares/upload.middleware');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /uploads:
 *   post:
 *     summary: Upload a file (image, PDF, etc.) — max 5MB
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded — { url, filename, mimetype, size }
 *       400:
 *         description: No file, file too large, or disallowed file type
 */
router.post(
  '/',
  protect,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large — max 5MB' });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err) return next(err); // AppError from the fileFilter (bad mime type)
      next();
    });
  },
  uploadFile
);

module.exports = router;
