const Userschema = require('../models/userSchema');
const generateToken = require('../token/token.js');
const bcrypt = require('bcryptjs');

const Register = async(req,res) =>{
  try{
    const {Vaultname,Vaultpassword} = req.body;
    if(!Vaultname || !Vaultpassword){
      res.status(400).json({message:"All is required to be Filled"});
      return;
    }
    const userExist = await Userschema.findOne({Vaultname:Vaultname});
    if(userExist){
      res.status(400).json({message:"Vault is already there"});
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(Vaultpassword,salt);
    const Final_user = await Userschema.create({
      Vaultname:Vaultname,
      Vaultpassword:hash_password,
    });
    if(Final_user){
    res.status(201).json({
      id: Final_user._id,
      Vaultname: Final_user.Vaultname,
      token: generateToken(Final_user._id),
    })}
  }catch(err){
      res.status(400).json({message:"Error in Registering"});
  }
}

const Login = async (req,res) => {
  try{
    const {Vaultname,Vaultpassword} = req.body;
    if(!Vaultname || !Vaultpassword){
      return res.status(400).json({message:"All is required to be Filled"});
    }
    const Userexist = await Userschema.findOne({Vaultname:Vaultname});
    if( Userexist && (await bcrypt.compare(Vaultpassword,Userexist.Vaultpassword))){
      res.status(201).json({
        id: Userexist._id,
        Vaultname: Userexist.Vaultname,
        token: generateToken(Userexist._id),
      })
    }else{
      res.status(400).json({message:"There is no such Vault"})
    }
  }catch (err) {
    res.status(400).json({ message: "Error in Login server", error: err.message });
  }   
}

module.exports = {Register,Login};