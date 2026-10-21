import { Request, Response } from "express";
import {
  create,
  createOne,
  find,
  findOneAndDelete,
  findOneAndUpdate,
  insertMany,
  updateMany,
} from "../../DB/db.repository";
import {
  INotification,
  NotificationModel,
} from "../../DB/Models/notification.model";
import {
  ICreateBulkNotificationsDTO,
  ICreateNotificationDTO,
  INotificationParamsDTO,
  INotificationQuerySchema,
} from "./notification.dto";
import { BadRequestException } from "../../Utils/response/error.response";
import { getIo } from "../../Utils/socket/socket.service";
class NotificationService {
  getNotifications = async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      isRead,
    } = req.query as unknown as INotificationQuerySchema;
    const skip = (page - 1) * limit;
    const filter: any = {
      userId: req.user._id,
    };
    if (isRead !== undefined) {
      filter.isRead = isRead;
    }
    const [notifications, total, unread] = await Promise.all([
      find({
        model: NotificationModel,
        filter,
        options: {
          skip,
          limit,
        },
      }),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({
        userId: req.user._id,
        isRead: false,
      }),
    ]);
    return res.status(200).json({
      message: "Done",
      data: {
        notifications,
        unread,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  };
  getUnreadCount = async (req: Request, res: Response) => {
    const unreadCount = await NotificationModel.countDocuments({
      userId: req.user!._id,
      isRead: false,
    });

    return res.status(200).json({
      message: "Unread count fetched successfully",
      data: { count: unreadCount },
    });
  };
  markAsRead = async (req: Request, res: Response) => {
    const { notificationId }: INotificationParamsDTO = req.params as {
      notificationId: string;
    };
    const updated = await findOneAndUpdate({
      model: NotificationModel,
      filter: {
        _id: notificationId,
        userId: req.user!._id,
      },
      update: {
        readAt: Date.now(),
        isRead: true,
      },
    });
    if (!updated)
      throw new BadRequestException(
        "Notification not found or faild to update",
      );
    return res.status(200).json({
      message: "Notification marked as read",
    });
  };
  markAllAsRead = async (req: Request, res: Response) => {
    await updateMany({
      model: NotificationModel,
      filter: { userId: req.user!._id, isRead: false },
      update: { isRead: true, readAt: new Date() },
    });
    return res.status(200).json({
      message: "All notifications marked as read",
    });
  };
  deleteNotification = async (req: Request, res: Response) => {
    const { notificationId }: INotificationParamsDTO = req.params as {
      notificationId: string;
    };
    const deleted = await findOneAndDelete({
      model: NotificationModel,
      filter: { userId: req.user!._id, _id: notificationId },
    });
    if (!deleted) throw new BadRequestException("Notification Not found ");

    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  };
  createNotification = async ({
    userId,
    type,
    title,
    message,
    data,
  }: ICreateNotificationDTO) => {
    const notification = (await createOne({
      model: NotificationModel,
      data: { userId, type, title, message, data },
    })) as INotification;
    const io = getIo();
    if (io) {
      io.to(String(userId)).emit("newNotification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
      });
    }
  };
  createBulkNotifications = async ({
    userIds,
    type,
    title,
    message,
    data,
  }: ICreateBulkNotificationsDTO) => {
    const notificationsPayload = userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data,
    }));
    const notifications =
      await NotificationModel.insertMany(notificationsPayload);
    const io = getIo();
    if (io) {
      notifications.forEach((doc) => {
        io.to(doc.userId.toString()).emit("newNotification", {
          id: doc._id,
          type: doc.type,
          title: doc.title,
          message: doc.message,
          data: doc.data,
          createdAt: doc.createdAt,
        });
      });
    }
    return notifications;
  };
}

export default new NotificationService();
