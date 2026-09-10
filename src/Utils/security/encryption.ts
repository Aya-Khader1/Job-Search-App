import crypto from "crypto";
import { env } from "../../config/config.service";

const ENCRYPTION_KEY: Buffer = Buffer.from(env.ENCRYPTION_SECRET_KEY, "utf-8");

export const encrypt = (text: string): string => {
  // Generate a new IV for every encryption
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encryptedData = cipher.update(text, "utf-8", "hex");
  encryptedData += cipher.final("hex");

  // Store IV as hex + encrypted data
  return `${iv.toString("hex")}:${encryptedData}`;
};

export const decrypt = (encryptedText: string): string => {
  const [ivHex, text] = encryptedText.split(":");

  if (!ivHex || !text) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decryptedData = decipher.update(text, "hex", "utf-8");
  decryptedData += decipher.final("utf-8");

  return decryptedData;
};
