import z from "zod";
import {
  getNotificationQuerySchema,
  IdParamsNotificationSchema,
} from "./notification.validation";
import { Types } from "mongoose";

export type INotificationQuerySchema = z.infer<
  typeof getNotificationQuerySchema.params
>;

export type INotificationParamsDTO = z.infer<
  typeof IdParamsNotificationSchema.params
>;
export interface ICreateNotificationDTO {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: any;
}
export interface ICreateBulkNotificationsDTO {
  userIds: Types.ObjectId[];
  type: string;
  title: string;
  message: string;
  data?: any;
}
