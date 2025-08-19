const mongoose = require('mongoose');

const VaultSchema = new mongoose.Schema({
  vaultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vault',
    required: true
  },
  Filename: {
    type: String,
    required: true,
  },
  cloudinaryurl: {  
    type: String,
    required: true,
  },
  filetype: {
    type: String,
    required: true,
  },
  filesize: {
    type: Number,
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('UsersVault', VaultSchema);