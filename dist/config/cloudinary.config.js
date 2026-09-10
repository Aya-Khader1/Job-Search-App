"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const config_service_1 = require("./config.service");
// Configuration
cloudinary_1.v2.config({
    cloud_name: config_service_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: config_service_1.env.CLOUDINARY_API_KEY,
    api_secret: config_service_1.env.CLOUDINARY_API_SECRET,
});
exports.default = cloudinary_1.v2;
