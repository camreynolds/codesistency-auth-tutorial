import crypto from "crypto";

export const generateVerificationToken = () => {
  // Cryptographically secure, always-6-digit code (100000-999999).
  // Replaced Math.random() over a 10000-909999 range, which was predictable
  // and produced 5-digit codes ~10% of the time — codes the 6-digit
  // verification UI could never submit.
  return crypto.randomInt(100000, 1000000).toString();
};