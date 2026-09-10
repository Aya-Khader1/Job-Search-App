import z from "zod";
import {
  idParamsSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "./user.validation";

export type IUpdateProfileDTO = z.infer<typeof updateProfileSchema.body>;
export type IIdParamsDTO = z.infer<typeof idParamsSchema.params>;

export type IUpdatePasswordDto = z.infer<typeof updatePasswordSchema.body>;
