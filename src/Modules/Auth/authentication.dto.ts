import z from "zod";
import {
  confirmEmailSchema,
  forgetPasswordSchema,
  loginWithGoogleSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./authentication.validation";

export type ISignUpDTO = z.infer<typeof signUpSchema.body>;
export type ISignInDTO = z.infer<typeof signInSchema.body>;
export type IConfirmEmailDTO = z.infer<typeof confirmEmailSchema.body>;
export type ILoginWithGoogleDTO = z.infer<typeof loginWithGoogleSchema.body>;
export type IResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;
export type IForgetPasswordDTO = z.infer<typeof forgetPasswordSchema.body>;
