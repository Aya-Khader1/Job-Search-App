"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = require("path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, path_1.resolve)("config/dev.env") });
exports.env = {
    //APP
    PORT: process.env.PORT,
    ENV_MODE: process.env.MODE,
    DB_URI: process.env.DB_URI,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
    ENCRYPTION_SECRET_KEY: process.env.ENCRYPTION_SECRET_KEY,
    WHITE_LIST: process.env.WHITE_LIST,
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    ACCESS_USER_SIGNATURE: process.env.ACCESS_USER_SIGNATURE,
    REFRESH_USER_SIGNATURE: process.env.REFRESH_USER_SIGNATURE,
    ACCESS_ADMIN_SIGNATURE: process.env.ACCESS_ADMIN_SIGNATURE,
    REFRESH_ADMIN_SIGNATURE: process.env.REFRESH_ADMIN_SIGNATURE,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    CLIENT_ID: process.env.CLIENT_ID,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
