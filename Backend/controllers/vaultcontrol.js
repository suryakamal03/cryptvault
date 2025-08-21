const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const VaultFile = require('../models/vaultSchema.js');

// Multer configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file function
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

// Get user vault files
const getUserVaultFiles = async (req, res) => {
  try {
    const files = await VaultFile.find({ vaultId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error('Fetch files error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files', error: error.message });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await VaultFile.findOne({ 
      _id: req.params.fileId, 
      vaultId: req.user._id 
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryPublicId);

    // Delete from MongoDB
    await VaultFile.findByIdAndDelete(req.params.fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'File deletion failed', error: error.message });
  }
};

module.exports = {
  upload,
  uploadFile,
  getUserVaultFiles,
  deleteFile
};