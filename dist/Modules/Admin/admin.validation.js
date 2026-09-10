"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdComapyParams = exports.IdUserParams = void 0;
const zod_1 = __importDefault(require("zod"));
exports.IdUserParams = {
    params: zod_1.default.strictObject({
        userId: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
    }),
};
exports.IdComapyParams = {
    params: zod_1.default.strictObject({
        companyId: zod_1.default.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
    }),
};
