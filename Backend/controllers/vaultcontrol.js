const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const VaultFile = require('../models/vaultSchema.js');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Get all files in user's vault
const getUserVaultFiles = async (req, res) => {
  try {
    const files = await VaultFile.find({ vaultId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: files.length, files });
  } catch (error) {
    console.error('Error fetching vault files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload file to vault
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Determine resource type
    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: `cryptvault/${req.user.Vaultname}` },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      uploadStream.end(req.file.buffer);
    });

    // Save file info in MongoDB
    const newFile = await VaultFile.create({
      vaultId: req.user._id,
      Filename: req.file.originalname,
      cloudinaryurl: result.secure_url,
      filetype: req.file.mimetype,
      filesize: req.file.size,
      cloudinaryPublicId: result.public_id
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: newFile._id,
        filename: newFile.Filename,
        url: newFile.cloudinaryurl,
        type: newFile.filetype,
        size: newFile.filesize,
        uploadDate: newFile.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed', error: error.message });
  }
};

// Delete file from vault
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await VaultFile.findOne({ _id: fileId, vaultId: req.user._id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found or unauthorized' });

    const resourceType = file.filetype === 'application/pdf' ? 'raw' : 'auto';
    if (file.cloudinaryPublicId) await cloudinary.uploader.destroy(file.cloudinaryPublicId, { resource_type: resourceType });

    await VaultFile.findByIdAndDelete(fileId);
    res.status(200).json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting file', error: error.message });
  }
};

// Export
module.exports = {
  upload: upload.single('file'),
  getUserVaultFiles,
  uploadFile,
  deleteFile
};
