import {User} from "../models/user.model.js"
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail,sendWelcomeEmail,sendPasswordResetEmail,sendResetSuccessEmail } from "../mailtrap/emails.js"

export const signup = async (req,res)=>{
  const {email,password,name} = req.body;
  
  try{
    if(!email || !password || !name){
      throw new Error("All fields are required.")
    }
    
    const userAlreadyExist = await User.findOne({email});
    if(userAlreadyExist){
      return res.status(400).json({success:false, message:"User already exists."})
    }
    
    const hashedPassword = await bcryptjs.hash(password,10);
    const verificationToken = generateVerificationToken();
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiredAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
    
    await user.save();
    
    //jwt
    generateTokenAndSetCookie(res,user._id);
    
    await sendVerificationEmail(user.email,verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password:undefined
      }
    });
  }catch(error){
    res.status(400).json({success:false, message:error.message});
  }
};

export const verifyEmail = async (req,res)=>{
  const {code} = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiredAt: {$gt: Date.now()}
    })

    if(!user){
      return res.status(400).json({success:false, message:"Invalid or expired verification code."})
    }

    user.isVerified = true;
    user.verificationToken = undefined,
    user.verificationTokenExpiredAt = undefined,
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user:{
        ...user._doc,
        password: undefined,
      }
    })
  } catch (error) {
    console.log("error in verifyEmail",error);    
    res.status(500).json({success: false, message:"server error"});
  }
}

export const login = async (req,res)=>{
  const {email,password} = req.body;

  try {
    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({success: false, message:"Invalid credentials."});
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if(!isPasswordValid){
      return res.status(400).json({success: false, message:"Invalid credentials"});
    }

    generateTokenAndSetCookie(res,user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged successfully.",
      user:{
        ...user._doc,
        password: undefined,
      }
    })
  } catch (error) {
    console.error("Error in login: ",error);
    res.status(400).json({success:false, message:error.message});
  }
};

export const logout = async (req,res)=>{
  res.clearCookie("token");
  res.status(200).json({success:true, message:"Logged out successfully."});
};

export const forgotPassword = async (req,res)=>{
  const {email} = req.body

  try {
    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({success:false, message:"User not found."})
    }

    //Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiredAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour.

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiredAt = resetTokenExpiredAt;

    await user.save();

    // send email
    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

    res.status(200).json({success: true, message:"Password reset link sent to your email."})
  } catch (error) {
    console.error("Error in forgotPassword ",error);
    res.status(400).json({success: false, message:error.message});
  }
};

export const resetPassword = async(req,res)=>{
  try {
    const {token} = req.params;
    const {password} = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiredAt: {$gt: Date.now()},
    })

    if(!user){
      return res.status(400).json({status: false, message:"Invalid or expired reset token."});
    }

    //update password
    const hashedPassword = await bcryptjs.hash(password,10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiredAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({success: true, message:"Password reset successfully."});
  } catch (error) {
    console.error("Error in reset password", error);
    res.status(400).json({sucess:false, message:error.message});    
  }
};

export const checkAuth = async(req,res)=>{
  try {
    const user = await User.findById(req.userId).select("-password");

    if(!user) {
      return res.status(400).json({success: false, message:"User not found."});
    };

    res.status(200).json({success: true, user});
  } catch (error) {
    console.error("Error in checkAuth.", error);
    res.status(400).json({success:false, message: error.message});
  }
};