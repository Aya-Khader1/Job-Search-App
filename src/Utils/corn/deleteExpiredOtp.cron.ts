import cron from "node-cron";
import { UserModel } from "../../DB/Models/user.model";

export const startExpiredOtpCleanupJob = () => {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const now = new Date();
      const result = await UserModel.updateMany(
        {},
        {
          $pull: {
            OTP: { expiresIn: { $lt: now } },
          },
        },
      );

      console.log(
        `[CRON] Expired OTP cleanup ran at ${now.toISOString()} — modified ${result.modifiedCount} users`,
      );
    } catch (error) {
      console.error("[CRON] Failed to clean up expired OTPs:", error);
    }
  });

  console.log("Expired OTP cleanup CRON job scheduled (every 6 hours)");
};
