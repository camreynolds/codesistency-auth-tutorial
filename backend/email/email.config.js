import nodemailer from "nodemailer";

// Nodemailer sends through Mailtrap's SMTP service, replacing the Mailtrap API client.
const requiredSettings = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_DOMAIN"];
const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);

if (missingSettings.length > 0) {
  throw new Error(`Missing email configuration: ${missingSettings.join(", ")}`);
}

const port = Number(process.env.SMTP_PORT || 2525);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SMTP_PORT must be a valid port number.");
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sender = {
  address: process.env.EMAIL_DOMAIN,
  name: "Mailtrap Test",
};