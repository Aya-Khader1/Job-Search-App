import { Router } from "express";
import chatService from "./chat.service";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
const router = Router();
router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));

router.get("/:userId", chatService.getChatHistory);

export default router;
