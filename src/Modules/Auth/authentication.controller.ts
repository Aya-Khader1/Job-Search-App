import { Router } from "express";
import authService from "./authentication.service";
import * as validators from "./authentication.validation";
import { validation } from "../../Middlewares/validation.middleware";
import { authentication } from "../../Middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../Utils/security/token";

const router = Router();

router.post("/signup", validation(validators.signUpSchema), authService.signup);
router.post(
  "/confirmEmail",
  validation(validators.confirmEmailSchema),
  authService.confirmEmail,
);
router.post("/login", authService.login);

router.post(
  "/google/login",
  validation(validators.loginWithGoogleSchema),
  authService.loginWithGoogle,
);
router.post(
  "/google/signup",
  validation(validators.loginWithGoogleSchema),
  authService.loginWithGoogle,
);

router.post(
  "/forget-password",
  validation(validators.forgetPasswordSchema),
  authService.forgetPassword,
);
router.post(
  "/resend-otp",
  validation(validators.forgetPasswordSchema),
  authService.resendOtp,
);
router.patch(
  "/reset-password",
  validation(validators.resetPasswordSchema),
  authService.resetPassword,
);
router.post(
  "/refresh-token",
  authentication({ tokenType: TokenTypeEnum.REFRESH }),
  authService.refreshToken,
);
export default router;
