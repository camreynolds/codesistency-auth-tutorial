import {User} from "../models/user.model.js"
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail,sendWelcomeEmail,sendPasswordResetEmail,sendResetSuccessEmail } from "../mailtrap/emails.js"

// Valid bcrypt hash used to equalize login timing: when no user is found we
// still run a bcrypt.compare against this dummy hash, so a non-existent email
// takes the same time as a wrong password and doesn't leak account existence.
const DUMMY_PASSWORD_HASH = bcryptjs.hashSync("dummy-password", 10);

export const signup = async (req,res)=>{
  const {email,password,name} = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  try{
    if(!email || !password || !name){
      throw new Error("All fields are required.")
    }
    
    const userAlreadyExist = await User.findOne({email:normalizedEmail});
    if(userAlreadyExist){
      // Anti-enumeration: return a generic message instead of "User already
      // exists." so this endpoint can't be used to probe which emails are
      // registered. (Trade-off: a user who already has an account is told to
      // retry rather than being told directly to log in.)
      return res.status(400).json({success:false, message:"Unable to create account."})
    }
    
    const hashedPassword = await bcryptjs.hash(password,10);
    const verificationToken = generateVerificationToken();
    
    const user = new User({
      email:normalizedEmail,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiredAt: Date.now() + 15 * 60 * 1000, // 15 minutes (was 24 hours; now matches the email template copy)
    })
    
    await user.save();
    
    try {
      await sendVerificationEmail(user.email,verificationToken);
    } catch (error) {
      console.error("Error sending signup verification email:", error);
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user, // sanitized by the schema's toJSON transform (no password/tokens)
    });
  }catch(error){
    // Handle race condition: duplicate email (MongoDB E11000)
    if (error.code === 11000) {
      return res.status(400).json({success: false, message: "Unable to create account."});
    }
    console.error("Error in signup:", error);
    res.status(500).json({success:false, message:"Unable to create account. Please try again."});
  }
};

export const resendVerificationEmail = async (req,res)=>{
  const {email} = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({email:normalizedEmail, isVerified:false});
    if (user) {
      const verificationToken = generateVerificationToken();
      user.verificationToken = verificationToken;
      user.verificationTokenExpiredAt = Date.now() + 15 * 60 * 1000;
      await user.save();

      try {
        await sendVerificationEmail(user.email,verificationToken);
      } catch (error) {
        console.error("Error resending verification email:", error);
      }
    }

    return res.status(200).json({
      success:true,
      message:"If an unverified account exists for that email, a verification code has been sent.",
    });
  } catch (error) {
    console.error("Error in resendVerificationEmail:", error);
    return res.status(500).json({success:false, message:"Unable to send a verification code. Please try again."});
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

    generateTokenAndSetCookie(res,user._id,user.tokenVersion);
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user, // sanitized by the schema's toJSON transform (no password/tokens)
    })
  } catch (error) {
    console.log("Error in verifyEmail: ",error);    
    res.status(500).json({success: false, message:"server error"});
  }
}

export const login = async (req,res)=>{
  const {email,password} = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({email:normalizedEmail});

    // Timing equalization: always run bcrypt.compare — against a dummy hash
    // when the user is missing — so the response time doesn't reveal whether
    // an account exists (previously a missing user returned early).
    const isPasswordValid = await bcryptjs.compare(password, user ? user.password : DUMMY_PASSWORD_HASH);

    if(!user || !isPasswordValid){
      return res.status(400).json({success: false, message:"Invalid credentials."});
    }

    if (!user.isVerified) {
      return res.status(403).json({success:false, message:"Please verify your email before logging in."});
    }

    user.lastLogin = new Date();
    await user.save();
    generateTokenAndSetCookie(res,user._id,user.tokenVersion);

    res.status(200).json({
      success: true,
      message: "Logged successfully.",
      user, // sanitized by the schema's toJSON transform (no password/tokens)
    })
  } catch (error) {
    console.error("Error in login: ",error);
    res.status(400).json({success:false, message:error.message});
  }
};

export const logout = async (req,res)=>{
  try {
    await User.findByIdAndUpdate(req.userId, {$inc:{tokenVersion:1}});
    res.clearCookie("token", {
      httpOnly:true,
      secure:process.env.NODE_ENV === "production",
      sameSite:"strict",
    });
    return res.status(200).json({success:true, message:"Logged out successfully."});
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({success:false, message:"Unable to log out. Please try again."});
  }
};

export const forgotPassword = async (req,res)=>{
  const {email} = req.body
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({email:normalizedEmail});

    // Anti-enumeration: always return the same generic response whether or
    // not the account exists, so this endpoint can't be used to discover
    // registered emails. (Previously it returned "User not found.".) Only
    // send the reset email when the account actually exists.
    if (user) {
      //Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetTokenExpiredAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour.

      // Store only a SHA-256 hash of the token so a database leak can't expose
      // usable reset links. The plaintext token is sent only in the email.
      const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpiredAt = resetTokenExpiredAt;

      await user.save();

      // send email (plaintext token, not the hash)
      try {
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
      } catch (error) {
        console.error("Error sending password reset email:", error);
      }
    }

    res.status(200).json({success: true, message:"If an account exists for that email, a password reset link has been sent."})
  } catch (error) {
    console.error("Error in forgotPassword ",error);
    res.status(400).json({success: false, message:error.message});
  }
};

export const resetPassword = async(req,res)=>{
  try {
    const {token} = req.params;
    const {password} = req.body;

    // Hash the incoming token the same way it was hashed on issue, so it can
    // be matched against the stored hash (the plaintext token is never saved).
    const hashedResetToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpiredAt: {$gt: Date.now()},
    })

    if(!user){
      return res.status(400).json({success: false, message:"Invalid or expired reset token."});
    }

    //update password
    const hashedPassword = await bcryptjs.hash(password,10);

    user.password = hashedPassword;
    user.tokenVersion += 1;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiredAt = undefined;
    await user.save();

    try {
      await sendResetSuccessEmail(user.email);
    } catch (error) {
      console.error("Error sending password reset confirmation email:", error);
    }

    res.status(200).json({success: true, message:"Password reset successfully."});
  } catch (error) {
    console.error("Error in reset password", error);
    res.status(400).json({success:false, message:error.message});
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