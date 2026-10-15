import z from "zod";

export const getNotificationQuerySchema = {
  params: z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    isRead: z.boolean(),
  }),
};

export const IdParamsNotificationSchema = {
  params: z.strictObject({
    notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid jobId"),
  }),
};
