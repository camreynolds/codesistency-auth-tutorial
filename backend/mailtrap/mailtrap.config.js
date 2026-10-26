import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.SENDING_ONBOARDING_API_TOKEN;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;

export const client = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: EMAIL_DOMAIN,
  name: "Mailtrap Test",
};