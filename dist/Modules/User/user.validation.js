"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.idParamsSchema = exports.updateProfileSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.updateProfileSchema = {
    body: zod_1.default.strictObject({
        firstName: zod_1.default
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(25, "First name must be less than 30 characters")
            .optional(),
        lastName: zod_1.default
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(25, "Last name must be less than 30 characters")
            .optional(),
        mobileNumber: zod_1.default
            .string()
            .regex(/^\+?[1-9]\d{7,14}$/, "Invalid mobile number")
            .optional(),
        DOB: zod_1.default.coerce
            .date()
            .refine((date) => date < new Date(), {
            message: "Date of birth must be before today",
        })
            .refine((date) => {
            const today = new Date();
            today.setFullYear(today.getFullYear() - 18);
            return date <= today;
        }, {
            message: "Age must be greater than 18",
        }),
        gender: zod_1.default.enum(["MALE", "FEMALE"]).optional(),
    }),
};
exports.idParamsSchema = {
    params: zod_1.default.strictObject({
        userId: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
    }),
};
exports.updatePasswordSchema = {
    body: zod_1.default.strictObject({
        oldPassword: zod_1.default.string().min(8, "Old password is required"),
        newPassword: zod_1.default
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(64, "Password must be less than 64 characters"),
    }),
};
