"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExpiredOtpCleanupJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const user_model_1 = require("../../DB/Models/user.model");
const startExpiredOtpCleanupJob = () => {
    node_cron_1.default.schedule("0 */6 * * *", async () => {
        try {
            const now = new Date();
            const result = await user_model_1.UserModel.updateMany({}, {
                $pull: {
                    OTP: { expiresIn: { $lt: now } },
                },
            });
            console.log(`[CRON] Expired OTP cleanup ran at ${now.toISOString()} — modified ${result.modifiedCount} users`);
        }
        catch (error) {
            console.error("[CRON] Failed to clean up expired OTPs:", error);
        }
    });
    console.log("Expired OTP cleanup CRON job scheduled (every 6 hours)");
};
exports.startExpiredOtpCleanupJob = startExpiredOtpCleanupJob;
