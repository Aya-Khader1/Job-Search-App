"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileTypeValidation = exports.uploadToCloudinary = exports.fileUpload = exports.fileValidation = void 0;
const multer_1 = __importDefault(require("multer"));
const file_type_1 = require("file-type");
const error_response_1 = require("../response/error.response");
const cloudinary_config_1 = __importDefault(require("../../config/cloudinary.config"));
exports.fileValidation = {
    images: ["image/png", "image/jpeg", "image/gif"],
    documents: ["application/pdf"],
};
const fileUpload = () => {
    return (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
    });
};
exports.fileUpload = fileUpload;
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const upload = cloudinary_config_1.default.uploader.upload_stream({ folder }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (!result?.public_id || !result.secure_url) {
                return reject(new Error("Failed to upload image"));
            }
            resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
            });
        });
        upload.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const fileTypeValidation = (validation = exports.fileValidation.images) => {
    return async (req, res, next) => {
        try {
            const files = req.file
                ? [req.file]
                : req.files || [];
            if (files.length === 0) {
                throw new error_response_1.BadRequestException("No file uploaded");
            }
            for (const file of files) {
                const detected = await (0, file_type_1.fileTypeFromBuffer)(file.buffer);
                if (!detected || !validation.includes(detected.mime)) {
                    throw new error_response_1.BadRequestException(`Invalid file type: ${detected?.mime || "unknown"}`);
                }
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.fileTypeValidation = fileTypeValidation;
