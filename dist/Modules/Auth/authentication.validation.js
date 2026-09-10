"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetPasswordSchema = exports.resetPasswordSchema = exports.loginWithGoogleSchema = exports.confirmEmailSchema = exports.signUpSchema = exports.signInSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.signInSchema = {
    body: zod_1.default.strictObject({
        email: zod_1.default.email({ error: "Invalid email address" }),
        password: zod_1.default
            .string({ error: "Password must be required" })
            .min(8, { error: "Password must be at least 8 character" })
            .max(64, { error: "Password must be at most 64 character long" }),
    }),
};
exports.signUpSchema = {
    body: exports.signInSchema.body.extend({
        username: zod_1.default
            .string({ error: "Username must be required" })
            .min(2, { error: "Username must be at least 2 character" })
            .max(25, { error: "Username must be at most 25 character long" }),
        mobileNumber: zod_1.default.string(),
    }),
};
exports.confirmEmailSchema = {
    body: zod_1.default.strictObject({
        email: zod_1.default.email({ error: "Invalid email address" }),
        otp: zod_1.default.string().regex(/^\d{6}$/),
    }),
};
exports.loginWithGoogleSchema = {
    body: zod_1.default.strictObject({
        idToken: zod_1.default
            .string({ error: "Google ID token is required" })
            .min(1, { error: "Google ID token cannot be empty" }),
    }),
};
exports.resetPasswordSchema = {
    body: zod_1.default.strictObject({
        email: zod_1.default.email({ error: "Invalid email address" }),
        otp: zod_1.default
            .string({ error: "OTP is required" })
            .regex(/^\d{6}$/, { error: "OTP must be 6 digits" }),
        newPassword: zod_1.default
            .string({ error: "Password is required" })
            .min(8, { error: "Password must be at least 8 characters" })
            .max(64, { error: "Password must be at most 64 characters long" }),
    }),
};
exports.forgetPasswordSchema = {
    body: zod_1.default.strictObject({
        email: zod_1.default.email({ error: "Invalid email address" }),
    }),
};
