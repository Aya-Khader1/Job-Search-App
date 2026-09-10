"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatusSchema = exports.getMatchedJobQuery = exports.getJobsQuery = exports.getJobsParams = exports.IdParamsJobSchema = exports.addJobSchema = void 0;
const zod_1 = require("zod");
const job_model_1 = require("../../DB/Models/job.model");
exports.addJobSchema = {
    body: zod_1.z.strictObject({
        jobTitle: zod_1.z
            .string({ error: "jobTitle is required" })
            .trim()
            .min(3, "jobTitle must be at least 3 characters")
            .max(64, "jobTitle must be at most 100 characters"),
        jobLocation: zod_1.z.enum(job_model_1.JobLocation, {
            error: (issue) => issue.input === undefined
                ? "JobLocation is required"
                : `JobLocation must be one of: ${Object.values(job_model_1.JobLocation).join(", ")}`,
        }),
        workingTime: zod_1.z.enum(job_model_1.WorkingTime, {
            error: (issue) => issue.input === undefined
                ? "workingTime is required"
                : `workingTime must be one of: ${Object.values(job_model_1.WorkingTime).join(", ")}`,
        }),
        jobDescription: zod_1.z
            .string({ error: "jobDescription is required" })
            .trim()
            .min(20, "jobDescription must be at least 20 characters")
            .max(500, "jobDescription must be at most 500 characters"),
        seniorityLevel: zod_1.z.enum(job_model_1.SeniorityLevel, {
            error: (issue) => issue.input === undefined
                ? "SeniorityLevel is required"
                : `SeniorityLevel must be one of: ${Object.values(job_model_1.SeniorityLevel).join(", ")}`,
        }),
        technicalSkills: zod_1.z
            .array(zod_1.z.string().trim().min(1))
            .min(1, "technicalSkills must contain at least 1 skill")
            .max(20, "technicalSkills must be at most 20 skills"),
        softSkills: zod_1.z
            .array(zod_1.z.string().trim().min(1))
            .min(1, "softSkills must contain at least 1 skill")
            .max(20, "softSkills must be at most 20 skills"),
    }),
};
exports.IdParamsJobSchema = {
    params: zod_1.z.strictObject({
        jobId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid jobId"),
    }),
};
exports.getJobsParams = {
    params: zod_1.z.strictObject({
        jobId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid jobId")
            .optional(),
        companyId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid companyId"),
    }),
};
exports.getJobsQuery = {
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
        sort: zod_1.z.string().optional(),
    }),
};
exports.getMatchedJobQuery = {
    query: exports.getJobsQuery.query.extend({
        workingTime: zod_1.z.enum(job_model_1.WorkingTime).optional(),
        jobLocation: zod_1.z.enum(job_model_1.JobLocation).optional(),
        seniorityLevel: zod_1.z.enum(job_model_1.SeniorityLevel).optional(),
        jobTitle: zod_1.z.string().trim().optional(),
        technicalSkills: zod_1.z.string().optional(),
        sort: zod_1.z.string().optional(),
    }),
};
exports.updateApplicationStatusSchema = {
    params: zod_1.z.strictObject({
        applicationId: zod_1.z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid applicationId"),
    }),
    body: zod_1.z.strictObject({
        status: zod_1.z.enum(["accepted", "rejected"], {
            error: 'status must be either "accepted" or "rejected"',
        }),
    }),
};
