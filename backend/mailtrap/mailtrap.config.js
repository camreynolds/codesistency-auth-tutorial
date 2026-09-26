import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.SENDING_ONBOARDING_API_TOKEN;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;
const PERSONAL_EMAIL = process.env.PERSONAL_EMAIL;

export const client = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: EMAIL_DOMAIN,
  name: "Mailtrap Test",
};

export const recipients = [
  {
    email: PERSONAL_EMAIL,
  }
];