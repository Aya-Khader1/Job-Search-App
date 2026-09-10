import z from "zod";

export const signInSchema = {
  body: z.strictObject({
    email: z.email({ error: "Invalid email address" }),
    password: z
      .string({ error: "Password must be required" })
      .min(8, { error: "Password must be at least 8 character" })
      .max(64, { error: "Password must be at most 64 character long" }),
  }),
};

export const signUpSchema = {
  body: signInSchema.body.extend({
    username: z
      .string({ error: "Username must be required" })
      .min(2, { error: "Username must be at least 2 character" })
      .max(25, { error: "Username must be at most 25 character long" }),
    mobileNumber: z.string(),
  }),
};

export const confirmEmailSchema = {
  body: z.strictObject({
    email: z.email({ error: "Invalid email address" }),
    otp: z.string().regex(/^\d{6}$/),
  }),
};
export const loginWithGoogleSchema = {
  body: z.strictObject({
    idToken: z
      .string({ error: "Google ID token is required" })
      .min(1, { error: "Google ID token cannot be empty" }),
  }),
};
export const resetPasswordSchema = {
  body: z.strictObject({
    email: z.email({ error: "Invalid email address" }),

    otp: z
      .string({ error: "OTP is required" })
      .regex(/^\d{6}$/, { error: "OTP must be 6 digits" }),

    newPassword: z
      .string({ error: "Password is required" })
      .min(8, { error: "Password must be at least 8 characters" })
      .max(64, { error: "Password must be at most 64 characters long" }),
  }),
};
export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.email({ error: "Invalid email address" }),
  }),
};
