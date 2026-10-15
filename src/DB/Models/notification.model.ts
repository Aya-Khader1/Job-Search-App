import mongoose, { HydratedDocument } from "mongoose";
import { Schema, Types } from "mongoose";

export enum NotificationTypeEnum {
  NEW_MESSAGE = "NEW_MESSAGE",
  NEW_APPLICATION = "NEW_APPLICATION",
  APPLICATION_STATUS = "APPLICATION_STATUS",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  COMPANY_APPROVED = "COMPANY_APPROVED",
  SYSTEM = "SYSTEM",
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt?: Date;
  readAt?: Date;
  updatedAt?: Date;
}
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export type HNotificationDocument = HydratedDocument<INotification>;
