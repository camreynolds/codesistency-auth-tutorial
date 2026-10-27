import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { sender, transporter } from "./email.config.js";

// SMTP uses standard message fields, so all former Mailtrap API sends share this helper.
const sendEmail = async (email, subject, html, context) => {
  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error(`Error sending ${context} email:`, error);
    throw new Error(`Error sending ${context} email.`, { cause: error });
  }
};

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export const sendVerificationEmail = async (email, verificationToken) => {
  await sendEmail(
    email,
    "Verify your email",
    VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
    "verification",
  );
};

export const sendWelcomeEmail = async (email, name) => {
  // The local HTML template replaces the Mailtrap-only template UUID and variables.
  await sendEmail(
    email,
    "Welcome!",
    WELCOME_EMAIL_TEMPLATE.replace("{name}", escapeHtml(name)),
    "welcome",
  );
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  await sendEmail(
    email,
    "Reset your password.",
    PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    "password reset",
  );
};

export const sendResetSuccessEmail = async (email) => {
  await sendEmail(
    email,
    "Password Reset Successfully!",
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    "password reset success",
  );
};