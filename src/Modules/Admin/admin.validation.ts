import z from "zod";

export const IdUserParams = {
  params: z.strictObject({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
  }),
};
export const IdComapyParams = {
  params: z.strictObject({
    companyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
  }),
};
