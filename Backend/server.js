const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const VaultFile = require('./models/vaultSchema.js'); // make sure path is correct
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

// Your existing routes
app.use('/auth/users', userRouter);
app.use('/users/vault', vaultRouter);

// ✅ Add this download route **after your vault routes**
app.get("/users/vault/download/:fileId", async (req, res) => {
  try {
    const file = await VaultFile.findById(req.params.fileId);
    if (!file) return res.status(404).send("File not found");

    const signedUrl = cloudinary.url(file.cloudinaryPublicId, {
      resource_type: "auto",
      type: "authenticated",
      attachment: true,
      expires_at: Math.floor(Date.now()/1000) + 60*10 // 10 min expiry
    });

    res.redirect(signedUrl);
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
