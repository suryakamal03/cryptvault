const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const VaultFile = require('./models/vaultSchema.js');
const userRouter = require('./routes/userrRoute.js');
const vaultRouter = require('./routes/vaultRoute.js');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Routes
app.use('/auth/users', userRouter);
app.use('/users/vault', vaultRouter);

// Download route with proper file streaming
app.get("/users/vault/download/:fileId", async (req, res) => {
  try {
    const file = await VaultFile.findById(req.params.fileId);
    if (!file) return res.status(404).send("File not found");

    // Use axios or node-fetch to get file from Cloudinary
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const fileUrl = file.cloudinaryurl;
    const parsedUrl = url.parse(fileUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    // Set download headers
    res.set({
      'Content-Disposition': `attachment; filename="${file.Filename}"`,
      'Content-Type': 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    });

    // Stream file from Cloudinary to client
    const request = client.get(fileUrl, (response) => {
      response.pipe(res);
    });
    
    request.on('error', (err) => {
      console.error('Download error:', err);
      res.status(500).send('Download failed');
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

const startServer = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.log(`Error: ${err.message}`);
    process.exit(1);
  }
};

startServer();