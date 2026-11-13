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

// Checks whether the request has a valid token, then returns the authenticated user's status.
router.get("/check-auth",verifyToken,checkAuth);
// Validates signup details, applies signup rate limiting, and creates a new account.
router.post("/signup",signupLimiter,signupValidation,handleValidationErrors,signup);
// Validates login details, applies login rate limiting, and authenticates the user.
router.post("/login",loginLimiter,loginValidation,handleValidationErrors,login);
// Requires a valid token, limits requests, and logs the authenticated user out.
router.post("/logout",authLimiter,verifyToken,logout);
// Validates the email verification request and confirms the user's email address.
router.post("/verify-email",verifyEmailLimiter,verifyEmailValidation,handleValidationErrors,verifyEmail);
// Validates and rate-limits a request to send another verification email.
router.post("/resend-verification",forgotPasswordLimiter,resendVerificationValidation,handleValidationErrors,resendVerificationEmail);
// Validates and rate-limits a request to begin the password recovery process.
router.post("/forgot-password",forgotPasswordLimiter,forgotPasswordValidation,handleValidationErrors,forgotPassword);
// Validates a new password and uses the URL token to complete the password reset.
router.post("/reset-password/:token",authLimiter,resetPasswordValidation,handleValidationErrors,resetPassword);

export default router;
