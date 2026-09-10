import { Router } from "express";
import adminService from "./admin.service";
import {
  authentication,
  authorization,
} from "../../Middlewares/authentication.middleware";
import { ROLE } from "../../Utils/enums/user.enum";
import { validation } from "../../Middlewares/validation.middleware";
import { IdComapyParams } from "./admin.validation";
import { TokenTypeEnum } from "../../Utils/security/token";
const router = Router();
router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));

router.use(authorization({ accessRoles: [ROLE.ADMIN] }));
router.patch("/users/banUnbanUser/:userId", adminService.banUnbanUser);
router.patch(
  "/companies/banUnbanCompany/:companyId",
  validation(IdComapyParams),
  adminService.banUnbanCompany,
);
router.patch(
  "/companies/approve-company/:companyId",
  validation(IdComapyParams),
  adminService.approvedCompany,
);

export default router;
