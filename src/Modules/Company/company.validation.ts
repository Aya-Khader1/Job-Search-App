import z from "zod";
import { employeeRanges } from "../../DB/Models/company.model";

export const addCompanySchema = {
  body: z.strictObject({
    companyName: z
      .string({ error: "Company name is required" })
      .min(2, "Company name must be at least 2 characters")
      .max(25, "Company name must be at most 25 characters"),

    description: z
      .string({ error: "Description is required" })
      .min(2, "Description must be at least 2 characters")
      .max(100, "Description must be at most 100 characters"),

    industry: z
      .string({ error: "Industry is required" })
      .min(2, "Industry must be at least 2 characters")
      .max(40, "Industry must be at most 40 characters"),

    address: z
      .string({ error: "Address is required" })
      .min(1, "Address cannot be empty"),

    numberOfEmployees: z.enum(employeeRanges),

    companyEmail: z
      .string({ error: "Company email is required" })
      .email("Invalid email format"),
  }),
};

export const updateCompanySchema = {
  body: addCompanySchema.body.partial(),
};
export const IdParamsCompanySchema = {
  params: z.strictObject({
    companyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
  }),
};
