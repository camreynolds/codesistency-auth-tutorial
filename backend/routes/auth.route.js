import express from "express";
import { 
  signup,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  checkAuth
} from "../controllers/auth.controllers.js";
import {verifyToken} from "../middleware/verifyToken.js";
// Rate limiters added per-route to protect against brute force and abuse.
import {
  authLimiter,
  signupLimiter,
  loginLimiter,
  verifyEmailLimiter,
  forgotPasswordLimiter,
} from "../middleware/rateLimiter.js";
// Input validation added to enforce email format, password length, etc.
import {
  handleValidationErrors,
  signupValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../middleware/validation.js";

const router = express.Router();

router.get("/check-auth",verifyToken,checkAuth);
router.post("/signup",signupLimiter,signupValidation,handleValidationErrors,signup);
router.post("/login",loginLimiter,loginValidation,handleValidationErrors,login);
router.post("/logout",authLimiter,verifyToken,logout);
router.post("/verify-email",verifyEmailLimiter,verifyEmailValidation,handleValidationErrors,verifyEmail);
router.post("/resend-verification",forgotPasswordLimiter,resendVerificationValidation,handleValidationErrors,resendVerificationEmail);
router.post("/forgot-password",forgotPasswordLimiter,forgotPasswordValidation,handleValidationErrors,forgotPassword);
router.post("/reset-password/:token",authLimiter,resetPasswordValidation,handleValidationErrors,resetPassword);

export default router;