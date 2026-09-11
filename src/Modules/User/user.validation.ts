import z from "zod";

export const updateProfileSchema = {
  body: z.strictObject({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be less than 30 characters")
      .optional(),

    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(25, "Last name must be less than 30 characters")
      .optional(),

    mobileNumber: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, "Invalid mobile number")
      .optional(),

    DOB: z.coerce
      .date()
      .refine((date) => date < new Date(), {
        message: "Date of birth must be before today",
      })
      .refine(
        (date) => {
          const today = new Date();
          today.setFullYear(today.getFullYear() - 18);
          return date <= today;
        },
        {
          message: "Age must be greater than 18",
        },
      ),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
  }),
};

export const idParamsSchema = {
  params: z.strictObject({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
  }),
};

export const updatePasswordSchema = {
  body: z.strictObject({
    oldPassword: z.string().min(8, "Old password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be less than 64 characters"),
  }),
};
