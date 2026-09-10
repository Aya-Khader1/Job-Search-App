import z from "zod";
import {
  addCompanySchema,
  IdParamsCompanySchema,
  updateCompanySchema,
} from "./company.validation";

export type IAddCompanyDTO = z.infer<typeof addCompanySchema.body>;
export type IUpdateCompanyDTO = z.infer<typeof updateCompanySchema.body>;
export type IIdCompanyParamsDTO = z.infer<typeof IdParamsCompanySchema.params>;
