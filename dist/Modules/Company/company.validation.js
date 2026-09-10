"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdParamsCompanySchema = exports.updateCompanySchema = exports.addCompanySchema = void 0;
const zod_1 = __importDefault(require("zod"));
const company_model_1 = require("../../DB/Models/company.model");
exports.addCompanySchema = {
    body: zod_1.default.strictObject({
        companyName: zod_1.default
            .string({ error: "Company name is required" })
            .min(2, "Company name must be at least 2 characters")
            .max(25, "Company name must be at most 25 characters"),
        description: zod_1.default
            .string({ error: "Description is required" })
            .min(2, "Description must be at least 2 characters")
            .max(100, "Description must be at most 100 characters"),
        industry: zod_1.default
            .string({ error: "Industry is required" })
            .min(2, "Industry must be at least 2 characters")
            .max(40, "Industry must be at most 40 characters"),
        address: zod_1.default
            .string({ error: "Address is required" })
            .min(1, "Address cannot be empty"),
        numberOfEmployees: zod_1.default.enum(company_model_1.employeeRanges),
        companyEmail: zod_1.default
            .string({ error: "Company email is required" })
            .email("Invalid email format"),
    }),
};
exports.updateCompanySchema = {
    body: exports.addCompanySchema.body.partial(),
};
exports.IdParamsCompanySchema = {
    params: zod_1.default.strictObject({
        companyId: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
    }),
};
