import { Router } from "express";
import notificationService from "./notification.service";
import * as validators from "./notification.validation";
import { validation } from "../../Middlewares/validation.middleware";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
const router = Router();
router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));

router.get(
  "/notifications",
  validation(validators.getNotificationQuerySchema),
  notificationService.getNotifications,
);
router.get("/unread-count", notificationService.getUnreadCount);
router.patch(
  "/mark-as-read/:notificationId",
  validation(validators.IdParamsNotificationSchema),
  notificationService.markAsRead,
);
router.patch("/mark-all-read", notificationService.markAsRead);
router.delete(
  "/:notificationId",
  validation(validators.IdParamsNotificationSchema),
  notificationService.deleteNotification,
);
export default router;
