import { Request, Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { JobModel } from "../../DB/Models/job.model";
import {
  IAddJobDTO,
  IGetJobParamsDTO,
  IGetJobQueryDTO,
  IGetMathchedJobQueryDTO,
  IIdJobParamsDTO,
  IUpdatedApplicationDTO,
} from "./job.dto";
import {
  count,
  create,
  createOne,
  find,
  findById,
  findOne,
  findOneAndDelete,
  findOneAndUpdate,
  updateOne,
} from "../../DB/db.repository";
import { ApplicationModel } from "../../DB/Models/application.model";
import { fileUpload, uploadToCloudinary } from "../../Utils/upload/cloudinary";
import { populate } from "dotenv";
import { HUserDocument } from "../../DB/Models/user.model";
import { emailEvents } from "../../Utils/events/email.event";
import { CompanyModel } from "../../DB/Models/company.model";
import { getIo } from "../../Utils/socket/socket.service";

class jobService {
  addJob = async (req: Request, res: Response) => {
    const {
      jobTitle,
      jobLocation,
      workingTime,
      jobDescription,
      seniorityLevel,
      technicalSkills,
      softSkills,
    }: IAddJobDTO = req.body;
    const company = req.company;
    if (!company) throw new NotFoundException("Company not found");
    const job = await JobModel.create({
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
  updateJob = async (req: Request, res: Response) => {
    const { jobId } = req.params as IIdJobParamsDTO;
    const job = await findOne({
      model: JobModel,
      filter: { _id: jobId },
    });
    if (!job) throw new NotFoundException("Job not found");

    const company = req.company!;
    if (job.companyId.toString() !== company._id.toString()) {
      throw new ForbiddenException("This job does not belong to your company");
    }
    const {
      jobTitle,
      jobLocation,
      workingTime,
      jobDescription,
      seniorityLevel,
      technicalSkills,
      softSkills,
      closed,
    } = req.body;

    const updatedJob = await findOneAndUpdate({
      model: JobModel,
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

    if (!updatedJob) throw new BadRequestException("Failed to update job");

    return res.status(200).json({
      message: "Job updated successfully",
      data: { job: updatedJob },
    });
  };
  deleteJob = async (req: Request, res: Response) => {
    const { jobId } = req.params as IIdJobParamsDTO;

    const job = await findOne({
      model: JobModel,
      filter: { _id: jobId },
    });

    if (!job) throw new NotFoundException("Job not found");

    const company = req.company!;

    if (job.companyId.toString() !== company._id.toString())
      throw new ForbiddenException("This job does not belong to your company");

    const deletedJob = await findOneAndDelete({
      model: JobModel,
      filter: { _id: jobId },
    });

    if (!deletedJob) throw new BadRequestException("Failed to delete job");

    return res.status(200).json({
      message: "Job deleted successfully",
    });
  };
  getJobs = async (req: Request, res: Response) => {
    const { page, limit }: IGetJobQueryDTO = req.query as unknown as {
      page: number;
      limit: number;
    };

    const { jobId, companyId }: IGetJobParamsDTO =
      req.params as IGetJobParamsDTO;

    if (jobId) {
      const job = await findOne({
        model: JobModel,
        filter: { _id: jobId, companyId: companyId },
      });

      if (!job) throw new NotFoundException("Job not found");
      return res.status(200).json({
        message: "Job fetched successfully",
        data: { job },
      });
    }

    const skip = (page - 1) * limit;
    const [jobs, totalJobs] = await Promise.all([
      find({
        model: JobModel,
        filter: { companyId },
        options: { skip, limit, sort: "-createdAt" },
      }),
      count({ model: JobModel, filter: { companyId } }),
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
  getMatchedJobs = async (req: Request, res: Response) => {
    const {
      page,
      limit,
      workingTime,
      jobLocation,
      seniorityLevel,
      jobTitle,
      technicalSkills,
    }: IGetMathchedJobQueryDTO = req.query as unknown as {
      page: number;
      limit: number;
    };

    const filter: any = {
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
      find({
        model: JobModel,
        filter,
        options: { skip, limit, sort: "-createdAt" },
      }),
      count({ model: JobModel, filter }),
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
          totalPages: Math.ceil(totalJobs / limit),
        },
      },
    });
  };
  getAllApplication = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const {
      page,
      limit,
      sort = "-createdAt",
    }: IGetJobQueryDTO = req.query as unknown as {
      page: number;
      limit: number;
    };
    const skip = (page - 1) * limit;
    const [applications, totalApplications] = await Promise.all([
      find({
        model: ApplicationModel,
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
      count({ model: ApplicationModel, filter: { jobId } }),
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
  applyJob = async (req: Request, res: Response) => {
    const { jobId } = req.params as IIdJobParamsDTO;
    const job = await findOne({
      model: JobModel,
      filter: { _id: jobId },
    });
    if (!job) throw new NotFoundException("Job not Found");
    if (job.closed) throw new BadRequestException("job is closed");
    const existsApplication = await findOne({
      model: ApplicationModel,
      filter: {
        jobId,
        userId: req.user._id,
      },
    });
    if (existsApplication)
      throw new BadRequestException("You have already applied to this job");
    if (!req.file) throw new BadRequestException("CV is required");
    const userCV = await uploadToCloudinary(
      req.file.buffer,
      `users/${req.user._id}/cvs`,
    );
    const application = await createOne({
      model: ApplicationModel,
      data: {
        jobId: job._id,
        userId: req.user._id,
        userCV: {
          secure_url: userCV.secure_url,
          public_id: userCV.public_id,
        },
      },
    });
    const company = await findOne({
      model: CompanyModel,
      filter: { _id: job.companyId },
    });
    if (company) {
      const io = getIo();
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
  updateApplicationStatus = async (req: Request, res: Response) => {
    const { applicationId }: IUpdatedApplicationDTO =
      req.params as unknown as IUpdatedApplicationDTO;
    const { status } = req.body as { status: "accepted" | "rejected" };
    const application = await findById({
      model: ApplicationModel,
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
    if (!application) throw new NotFoundException("Application Not Found");
    const updatedApplication = await updateOne({
      model: ApplicationModel,
      filter: { _id: applicationId },
      update: { $set: { status } },
    });
    if (!updatedApplication)
      throw new BadRequestException("Failed to update application status");

    const applicant = application.userId as unknown as HUserDocument;
    emailEvents.emit(status === "accepted" ? "acceptedJob" : "rejectedJob", {
      to: applicant.email,
      username: applicant.firstName,
    });

    return res.status(200).json({
      message: `Application ${status} successfully`,
    });
  };
}

export default new jobService();
