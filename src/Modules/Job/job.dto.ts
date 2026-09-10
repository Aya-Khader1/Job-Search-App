import z from "zod";
import {
  addJobSchema,
  getJobsParams,
  getJobsQuery,
  getMatchedJobQuery,
  IdParamsJobSchema,
  updateApplicationStatusSchema,
} from "./job.validation";
import { updateCompanySchema } from "../Company/company.validation";

export type IAddJobDTO = z.infer<typeof addJobSchema.body>;
export type IIdJobParamsDTO = z.infer<typeof IdParamsJobSchema.params>;

export type IGetJobParamsDTO = z.infer<typeof getJobsParams.params>;

export type IGetJobQueryDTO = z.infer<typeof getJobsQuery.query>;
export type IGetMathchedJobQueryDTO = z.infer<typeof getMatchedJobQuery.query>;
export type IUpdatedApplicationDTO = z.infer<
  typeof updateApplicationStatusSchema.params
>;
