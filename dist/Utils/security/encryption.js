"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_service_1 = require("../../config/config.service");
const ENCRYPTION_KEY = Buffer.from(config_service_1.env.ENCRYPTION_SECRET_KEY, "utf-8");
const encrypt = (text) => {
    // Generate a new IV for every encryption
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encryptedData = cipher.update(text, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    // Store IV as hex + encrypted data
    return `${iv.toString("hex")}:${encryptedData}`;
};
exports.encrypt = encrypt;
const decrypt = (encryptedText) => {
    const [ivHex, text] = encryptedText.split(":");
    if (!ivHex || !text) {
        throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decryptedData = decipher.update(text, "hex", "utf-8");
    decryptedData += decipher.final("utf-8");
    return decryptedData;
};
exports.decrypt = decrypt;
