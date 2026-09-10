import { Router } from "express";
import userService from "./user.service";
import * as validators from "./user.validation";
import { validation } from "../../Middlewares/validation.middleware";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";
import {
  fileTypeValidation,
  fileUpload,
  fileValidation,
} from "../../Utils/upload/cloudinary";

const router = Router();
router.use(authentication({ tokenType: TokenTypeEnum.ACCESS }));
router.patch(
  "/update-profile",
  validation(validators.updateProfileSchema),
  userService.updateProfile,
);
router.post("/getLoginUser", userService.getLoginUser);
router.post(
  "/profile/:userId",
  validation(validators.idParamsSchema),
  userService.getUserProfile,
);

router.patch(
  "/update-password",
  validation(validators.updatePasswordSchema),
  userService.updatePassword,
);
router.post(
  "/upload-pic",
  fileUpload().single("image"),
  fileTypeValidation(fileValidation.images),
  userService.uploadProfilePic,
);

router.post(
  "/cover-pic",
  fileUpload().array("images", 5),
  fileTypeValidation(fileValidation.images),
  userService.uploadCoverPic,
);

router.delete("/delete-profile-pic", userService.deleteProfilePic);
router.delete("/delete-cover-pic", userService.deleteCoverPic);
router.patch("/soft-delete", userService.softDeleteAccount);
export default router;
