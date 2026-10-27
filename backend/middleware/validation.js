import { body, param, validationResult } from "express-validator";

// Server-side input validation (added because the backend previously only
// checked field presence — no email format, password length, or size limits).
// The frontend's checks are cosmetic; these enforce the rules at the API.

// Central error handler: if any prior validator failed, respond 400 with the
// first error message, keeping the { success, message } JSON shape the
// frontend reads from error.response.data.message.
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const passwordValidation = () => body("password")
  .isString().withMessage("Password must be text.")
  .bail()
  .isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
  .bail()
  .custom((password) => Buffer.byteLength(password, "utf8") <= 72)
  .withMessage("Password must be 72 UTF-8 bytes or fewer.");

export const signupValidation = [
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ max: 100 }).withMessage("Name must be 100 characters or fewer."),
  body("email").trim().toLowerCase().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .isLength({ max: 254 }).withMessage("Email must be 254 characters or fewer."),
  passwordValidation(),
];

export const loginValidation = [
  body("email").trim().toLowerCase().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email."),
  passwordValidation(),
];

export const verifyEmailValidation = [
  body("email").trim().toLowerCase().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .isLength({ max: 254 }).withMessage("Email must be 254 characters or fewer."),
  body("code").trim().matches(/^\d{6}$/).withMessage("Verification code must be a 6-digit number."),
];

export const forgotPasswordValidation = [
  body("email").trim().toLowerCase().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email."),
];

export const resendVerificationValidation = [
  body("email").trim().toLowerCase().notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .isLength({ max: 254 }).withMessage("Email must be 254 characters or fewer."),
];

export const resetPasswordValidation = [
  param("token").notEmpty().withMessage("Reset token is required."),
  passwordValidation(),
];
