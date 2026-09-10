import { z } from "zod";
import {
  JobLocation,
  WorkingTime,
  SeniorityLevel,
} from "../../DB/Models/job.model";

export const addJobSchema = {
  body: z.strictObject({
    jobTitle: z
      .string({ error: "jobTitle is required" })
      .trim()
      .min(3, "jobTitle must be at least 3 characters")
      .max(64, "jobTitle must be at most 100 characters"),

    jobLocation: z.enum(JobLocation, {
      error: (issue) =>
        issue.input === undefined
          ? "JobLocation is required"
          : `JobLocation must be one of: ${Object.values(JobLocation).join(", ")}`,
    }),

    workingTime: z.enum(WorkingTime, {
      error: (issue) =>
        issue.input === undefined
          ? "workingTime is required"
          : `workingTime must be one of: ${Object.values(WorkingTime).join(", ")}`,
    }),
    jobDescription: z
      .string({ error: "jobDescription is required" })
      .trim()
      .min(20, "jobDescription must be at least 20 characters")
      .max(500, "jobDescription must be at most 500 characters"),

    seniorityLevel: z.enum(SeniorityLevel, {
      error: (issue) =>
        issue.input === undefined
          ? "SeniorityLevel is required"
          : `SeniorityLevel must be one of: ${Object.values(SeniorityLevel).join(", ")}`,
    }),

    technicalSkills: z
      .array(z.string().trim().min(1))
      .min(1, "technicalSkills must contain at least 1 skill")
      .max(20, "technicalSkills must be at most 20 skills"),

    softSkills: z
      .array(z.string().trim().min(1))
      .min(1, "softSkills must contain at least 1 skill")
      .max(20, "softSkills must be at most 20 skills"),
  }),
};
export const IdParamsJobSchema = {
  params: z.strictObject({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid jobId"),
  }),
};

export const getJobsParams = {
  params: z.strictObject({
    jobId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid jobId")
      .optional(),
    companyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
  }),
};

export const getJobsQuery = {
  query: z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
  }),
};
export const getMatchedJobQuery = {
  query: getJobsQuery.query.extend({
    workingTime: z.enum(WorkingTime).optional(),
    jobLocation: z.enum(JobLocation).optional(),
    seniorityLevel: z.enum(SeniorityLevel).optional(),
    jobTitle: z.string().trim().optional(),
    technicalSkills: z.string().optional(),
    sort: z.string().optional(),
  }),
};
export const updateApplicationStatusSchema = {
  params: z.strictObject({
    applicationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid applicationId"),
  }),
  body: z.strictObject({
    status: z.enum(["accepted", "rejected"], {
      error: 'status must be either "accepted" or "rejected"',
    }),
  }),
};
