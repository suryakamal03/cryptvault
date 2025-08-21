const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/userMiddleware.js');
const { upload, getUserVaultFiles, uploadFile, deleteFile } = require('../controllers/vaultcontrol.js');

router.get('/files', protect, getUserVaultFiles);
router.post('/upload', protect, upload.single('file'), uploadFile);
router.delete('/files/:fileId', protect, deleteFile);

module.exports = router;