import { rateLimit } from "express-rate-limit";

// Rate limiting added to harden the auth endpoints (previously there was none,
// so an attacker could brute-force the 6-digit verification code, stuff login
// credentials, or bomb the forgot-password endpoint with emails).
// Each limiter is keyed by IP address (the library default) using an in-memory
// store. NOTE: for multi-instance/production deployments, replace the default
// MemoryStore with a shared store (e.g. Redis) and set `trust proxy` correctly.

const jsonMessage = (message) => ({ success: false, message });

// General limiter for low-risk auth routes (logout, reset-password).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many requests, please try again later."),
});

// Login: slow credential stuffing / password guessing.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many login attempts, please try again later."),
});

// Signup: prevent mass account creation.
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many signup attempts, please try again later."),
});

// Email verification: a 6-digit code is brute-forceable, so cap attempts tightly.
export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many verification attempts, please try again later."),
});

// Forgot password: prevent email bombing and account enumeration.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many requests, please try again later."),
});
