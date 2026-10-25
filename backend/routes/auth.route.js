import express from "express";
import { 
  signup,
  login,
  logout,
  verifyEmail,
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

const router = express.Router();

router.get("/check-auth",verifyToken,checkAuth);
router.post("/signup",signupLimiter,signup);
router.post("/login",loginLimiter,login);
router.post("/logout",authLimiter,logout);
router.post("/verify-email",verifyEmailLimiter,verifyEmail);
router.post("/forgot-password",forgotPasswordLimiter,forgotPassword);
router.post("/reset-password/:token",authLimiter,resetPassword);

export default router;