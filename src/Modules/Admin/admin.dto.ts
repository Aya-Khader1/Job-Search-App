import z from "zod";
import { IdComapyParams, IdUserParams } from "./admin.validation";

export type IdUserIdParams = z.infer<typeof IdUserParams.params>;
export type IdCompanyParams = z.infer<typeof IdComapyParams.params>;
