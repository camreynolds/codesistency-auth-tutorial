import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    maxlength:254,
  },
  password:{
    type:String,
    required:true,
  },
  name:{
    type:String,
    required:true,
    trim:true,
    maxlength:100,
  },
  lastLogin:{
    type:Date,
    default:Date.now,
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  resetPasswordToken: String,
  resetPasswordExpiredAt: Date,
  verificationToken: String,
  verificationTokenExpiredAt: Date,
},{timestamps:true});

// createdAt and updatedAt fields will be automatically added into the document.

export const User = mongoose.model("User", userSchema);