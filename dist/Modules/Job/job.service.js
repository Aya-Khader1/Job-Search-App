"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_response_1 = require("../../Utils/response/error.response");
const job_model_1 = require("../../DB/Models/job.model");
const db_repository_1 = require("../../DB/db.repository");
const application_model_1 = require("../../DB/Models/application.model");
const cloudinary_1 = require("../../Utils/upload/cloudinary");
const email_event_1 = require("../../Utils/events/email.event");
const company_model_1 = require("../../DB/Models/company.model");
const socket_service_1 = require("../../Utils/socket/socket.service");
class jobService {
    addJob = async (req, res) => {
        const { jobTitle, jobLocation, workingTime, jobDescription, seniorityLevel, technicalSkills, softSkills, } = req.body;
        const company = req.company;
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        const job = await job_model_1.JobModel.create({
            jobTitle,
            jobLocation,
            workingTime,
            jobDescription,
            seniorityLevel,
            technicalSkills,
            softSkills,
            companyId: company._id,
            addedBy: req.user._id,
        });
        return res.status(201).json({
            message: "Job added successfully",
            data: { job },
        });
    };
    updateJob = async (req, res) => {
        const { jobId } = req.params;
        const job = await (0, db_repository_1.findOne)({
            model: job_model_1.JobModel,
            filter: { _id: jobId },
        });
        if (!job)
            throw new error_response_1.NotFoundException("Job not found");
        const company = req.company;
        if (job.companyId.toString() !== company._id.toString()) {
            throw new error_response_1.ForbiddenException("This job does not belong to your company");
        }
        const { jobTitle, jobLocation, workingTime, jobDescription, seniorityLevel, technicalSkills, softSkills, closed, } = req.body;
        const updatedJob = await (0, db_repository_1.findOneAndUpdate)({
            model: job_model_1.JobModel,
            filter: { _id: jobId },
            update: {
                ...(jobTitle !== undefined && { jobTitle }),
                ...(jobLocation !== undefined && { jobLocation }),
                ...(workingTime !== undefined && { workingTime }),
                ...(jobDescription !== undefined && { jobDescription }),
                ...(seniorityLevel !== undefined && { seniorityLevel }),
                ...(technicalSkills !== undefined && { technicalSkills }),
                ...(softSkills !== undefined && { softSkills }),
                ...(closed !== undefined && { closed }),
                updatedBy: req.user._id,
            },
        });
        if (!updatedJob)
            throw new error_response_1.BadRequestException("Failed to update job");
        return res.status(200).json({
            message: "Job updated successfully",
            data: { job: updatedJob },
        });
    };
    deleteJob = async (req, res) => {
        const { jobId } = req.params;
        const job = await (0, db_repository_1.findOne)({
            model: job_model_1.JobModel,
            filter: { _id: jobId },
        });
        if (!job)
            throw new error_response_1.NotFoundException("Job not found");
        const company = req.company;
        if (job.companyId.toString() !== company._id.toString())
            throw new error_response_1.ForbiddenException("This job does not belong to your company");
        const deletedJob = await job_model_1.JobModel.findByIdAndDelete(jobId);
        if (!deletedJob)
            throw new error_response_1.BadRequestException("Failed to delete job");
        return res.status(200).json({
            message: "Job deleted successfully",
        });
    };
    getJobs = async (req, res) => {
        const { page, limit } = req.query;
        const { jobId, companyId } = req.params;
        if (jobId) {
            const job = await (0, db_repository_1.findOne)({
                model: job_model_1.JobModel,
                filter: { _id: jobId, companyId: companyId },
            });
            if (!job)
                throw new error_response_1.NotFoundException("Job not found");
            return res.status(200).json({
                message: "Job fetched successfully",
                data: { job },
            });
        }
        const skip = (page - 1) * limit;
        const [jobs, totalJobs] = await Promise.all([
            await (0, db_repository_1.find)({
                model: job_model_1.JobModel,
                filter: { companyId },
                options: { skip, limit, sort: "-createdAt" },
            }),
            (0, db_repository_1.count)({ model: job_model_1.JobModel, filter: { companyId } }),
        ]);
        return res.status(200).json({
            message: "Jobs fetched successfully",
            data: {
                jobs,
                pagination: {
                    totalJobs,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(totalJobs / limit),
                },
            },
        });
    };
    getMatchedJobs = async (req, res) => {
        const { page, limit, workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills, } = req.query;
        const filter = {
            ...(workingTime && { workingTime }),
            ...(jobLocation && { jobLocation }),
            ...(seniorityLevel && { seniorityLevel }),
            ...(jobTitle && { jobTitle: { $regex: jobTitle, $options: "i" } }),
            ...(technicalSkills && {
                technicalSkills: {
                    $in: technicalSkills.split(",").map((skill) => skill.trim()),
                },
            }),
        };
        const skip = (page - 1) * limit;
        const [jobs, totalJobs] = await Promise.all([
            (0, db_repository_1.find)({
                model: job_model_1.JobModel,
                filter,
                options: { skip, limit, sort: "-createdAt" },
            }),
            (0, db_repository_1.count)({ model: job_model_1.JobModel, filter }),
        ]);
        console.log({
            totalJobs,
            limit,
            page,
            totalPages: Math.ceil(totalJobs / limit),
        });
        return res.status(200).json({
            message: "Jobs fetched successfully",
            data: {
                pagination: {
                    jobs,
                    totalJobs,
                    page,
                    limit,
                    totalPages: totalJobs / limit,
                },
            },
        });
    };
    getAllApplication = async (req, res) => {
        const { jobId } = req.params;
        const { page, limit, sort = "-createdAt", } = req.query;
        const skip = (page - 1) * limit;
        const [applications, totalApplications] = await Promise.all([
            await (0, db_repository_1.find)({
                model: application_model_1.ApplicationModel,
                filter: { jobId },
                options: {
                    skip,
                    limit,
                    sort: "-createdAt",
                    populate: {
                        path: "user",
                        select: "firstName lastName email profilePic",
                    },
                },
            }),
            (0, db_repository_1.count)({ model: application_model_1.ApplicationModel, filter: { jobId } }),
        ]);
        return res.status(200).json({
            message: "Job applications fetched successfully",
            data: {
                applications,
                pagination: {
                    totalApplications,
                    page,
                    limit,
                    totalPages: Math.ceil(totalApplications / limit),
                },
            },
        });
    };
    applyJob = async (req, res) => {
        const { jobId } = req.params;
        const job = await (0, db_repository_1.findOne)({
            model: job_model_1.JobModel,
            filter: { _id: jobId },
        });
        if (!job)
            throw new error_response_1.NotFoundException("Job not Found");
        if (job.closed)
            throw new error_response_1.BadRequestException("job is closed");
        const existsApplication = await (0, db_repository_1.findOne)({
            model: application_model_1.ApplicationModel,
            filter: {
                jobId,
                userId: req.user._id,
            },
        });
        if (existsApplication)
            throw new error_response_1.BadRequestException("You have already applied to this job");
        if (!req.file)
            throw new error_response_1.BadRequestException("CV is required");
        const userCV = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, `users/${req.user._id}/cvs`);
        const application = await (0, db_repository_1.createOne)({
            model: application_model_1.ApplicationModel,
            data: {
                jobId: job._id,
                userId: req.user._id,
                userCV: {
                    secure_url: userCV.secure_url,
                    public_id: userCV.public_id,
                },
            },
        });
        const company = await (0, db_repository_1.findOne)({
            model: company_model_1.CompanyModel,
            filter: { _id: job.companyId },
        });
        if (company) {
            const io = (0, socket_service_1.getIo)();
            const recipientIds = [...(company.HRs || [])];
            recipientIds.forEach((id) => {
                io?.to(id.toString()).emit("newApplication", {
                    message: `New application submitted for ${job.jobTitle}`,
                    jobTitle: job.jobTitle,
                    companyName: company.companyName,
                    applicantName: `${req.user.firstName} ${req.user.lastName}`,
                });
            });
        }
        return res.status(201).json({
            message: "Job application submitted successfully",
            data: {
                application,
            },
        });
    };
    updateApplicationStatus = async (req, res) => {
        const { applicationId } = req.params;
        const { status } = req.body;
        const application = await (0, db_repository_1.findById)({
            model: application_model_1.ApplicationModel,
            id: applicationId,
            options: {
                populate: [
                    {
                        path: "user",
                        select: "",
                    },
                    { path: "job", select: "" },
                ],
            },
        });
        if (!application)
            throw new error_response_1.NotFoundException("Application Not Found");
        const updatedApplication = await (0, db_repository_1.updateOne)({
            model: application_model_1.ApplicationModel,
            filter: { _id: applicationId },
            update: { $set: { status } },
        });
        if (!updatedApplication)
            throw new error_response_1.BadRequestException("Failed to update application status");
        const applicant = application.userId;
        email_event_1.emailEvents.emit(status === "accepted" ? "acceptedJob" : "rejectedJob", {
            to: applicant.email,
            username: applicant.firstName,
        });
        return res.status(200).json({
            message: `Application ${status} successfully`,
        });
    };
}
exports.default = new jobService();
