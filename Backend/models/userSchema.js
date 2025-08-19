const mongoose = require('mongoose');
const Userschema = mongoose.Schema({
  Vaultname:{
    type:String,
    required:true
  },
  Vaultpassword:{
    type:String,
    required:true
  },

},  { timestamps: true });
module.exports = mongoose.model('Vault',Userschema);
