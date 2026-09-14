import { Request, Response } from "express";
import {
  create,
  createOne,
  find,
  findOne,
  findOneAndUpdate,
  updateOne,
} from "../../DB/db.repository";
import { CompanyModel } from "../../DB/Models/company.model";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "../../Utils/response/error.response";
import {
  IAddCompanyDTO,
  IIdCompanyParamsDTO,
  IUpdateCompanyDTO,
} from "./company.dto";
import { ROLE } from "../../Utils/enums/user.enum";
import cloudinary from "../../config/cloudinary.config";
import { uploadToCloudinary } from "../../Utils/upload/cloudinary";
import { populate } from "dotenv";
import { ApplicationModel } from "../../DB/Models/application.model";
import { JobModel } from "../../DB/Models/job.model";
import ExcelJS from "exceljs";

class companyService {
  constructor() {}
  addCompany = async (req: Request, res: Response): Promise<Response> => {
    const {
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
    }: IAddCompanyDTO = req.body;
    const existingCompany = await findOne({
      model: CompanyModel,
      filter: {
        $or: [{ companyName }, { companyEmail }],
      },
    });

    if (existingCompany) {
      throw new ConflictException("Company name or email already exists");
    }
    const newCompany = await createOne({
      model: CompanyModel,
      data: {
        companyName,
        description,
        industry,
        address,
        numberOfEmployees,
        companyEmail,
        createdBy: req.user._id,
      },
    });
    return res.status(201).json({
      message: "Company created successfully",
      data: { newCompany },
    });
  };
  updateCompany = async (req: Request, res: Response): Promise<Response> => {
    const { companyId } = req.params as IIdCompanyParamsDTO;

    const {
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
    }: IUpdateCompanyDTO = req.body;

    const existingCompany = await findOne({
      model: CompanyModel,
      filter: { _id: companyId },
    });

    if (!existingCompany) {
      throw new NotFoundException("Company not found");
    }

    if (existingCompany.createdBy.toString() !== req.user._id.toString()) {
      throw new ForbiddenException(
        "You are not authorized to update this company",
      );
    }
    const updatedCompany = await updateOne({
      model: CompanyModel,
      filter: { _id: companyId },
      update: {
        $set: {
          companyName,
          description,
          industry,
          address,
          numberOfEmployees,
          companyEmail,
        },
      },
    });

    if (!updatedCompany) {
      throw new BadRequestException("Failed to update company");
    }

    return res.status(200).json({
      message: "Company updated successfully",
    });
  };

  getSpecificCompany = async (req: Request, res: Response) => {
    const { companyId } = req.params as IIdCompanyParamsDTO;
    const company = await findOne({
      model: CompanyModel,
      filter: { _id: companyId },
      options: {
        populate: { path: "jobs" },
      },
    });
    if (!company) throw new NotFoundException("Company not found");
    return res.status(200).json({
      message: "Company fetched successfully",
      data: { company },
    });
  };
  searchCompany = async (req: Request, res: Response): Promise<Response> => {
    const { name } = req.query as { name?: string };
    if (!name || name.trim() === "")
      throw new BadRequestException("Search name is required");

    const companies = await find({
      model: CompanyModel,
      filter: { companyName: { $regex: name, $options: "i" } },
    });
    return res.status(200).json({
      message: "Companies fetched successfully",
      data: { companies },
    });
  };
  deleteCompany = async (req: Request, res: Response): Promise<Response> => {
    const { companyId } = req.params as IIdCompanyParamsDTO;
    const company = await findOne({
      model: CompanyModel,
      filter: { _id: companyId },
    });

    if (!company) throw new BadRequestException("Company not found");
    const isOwner = company.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLE.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "Only the admin or the company owner can perform this action",
      );
    }
    const deletedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: companyId },
      update: { $set: { deletedAt: new Date() } },
    });

    if (!deletedCompany) {
      throw new BadRequestException("Failed to delete company");
    }

    return res.status(200).json({
      message: "Company deleted successfully",
    });
  };
  uploadLogo = async (req: Request, res: Response): Promise<Response> => {
    if (!req.file) throw new BadRequestException("No file uploaded");

    const company = req.company;
    if (!company) throw new NotFoundException("Company not found");

    const oldPublicId = company.logo?.public_id || null;

    const { public_id, secure_url } = await uploadToCloudinary(
      req.file.buffer,
      `company/${company._id}/logo-picture`,
    );

    const updatedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: company._id },
      update: { $set: { logo: { public_id, secure_url } } },
    });

    if (!updatedCompany) {
      await cloudinary.uploader.destroy(public_id).catch((err) => {
        console.error(
          "Failed to cleanup orphaned logo upload:",
          public_id,
          err,
        );
      });
      throw new BadRequestException("Failed to update logo picture");
    }

    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch((err) => {
        console.error("Failed to delete old logo:", oldPublicId, err);
      });
    }

    return res.status(200).json({
      message: "Logo uploaded successfully",
      data: { logo: { public_id, secure_url } },
    });
  };

  deleteLogo = async (req: Request, res: Response): Promise<Response> => {
    const company = req.company;
    if (!company) throw new NotFoundException("Company not found");

    if (!company.logo?.public_id)
      throw new BadRequestException("No logo found for this company");

    const oldPublicId = company.logo.public_id;

    const updatedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: company._id },
      update: { $unset: { logo: "" } },
    });

    if (!updatedCompany) throw new BadRequestException("Failed to delete logo");

    cloudinary.uploader.destroy(oldPublicId).catch((err) => {
      console.error("Failed to delete logo from Cloudinary:", oldPublicId, err);
    });

    return res.status(200).json({
      message: "Logo deleted successfully",
    });
  };

  uploadCoverPic = async (req: Request, res: Response): Promise<Response> => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
      throw new BadRequestException("No file uploaded");

    const company = req.company;
    if (!company) throw new NotFoundException("Company not found");

    const coverPics = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const { secure_url, public_id } = await uploadToCloudinary(
          file.buffer,
          `company/${company._id}/cover-pictures`,
        );
        return { secure_url, public_id };
      }),
    );

    const updatedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: company._id },
      update: {
        $push: {
          coverPic: { $each: coverPics },
        },
      },
    });

    if (!updatedCompany)
      throw new BadRequestException("Failed to update cover picture");

    return res.status(200).json({
      message: "Cover picture uploaded successfully",
      data: { coverPics },
    });
  };

  deleteCoverPic = async (req: Request, res: Response): Promise<Response> => {
    const { public_id } = req.body;
    if (!public_id) throw new BadRequestException("public_id is required");

    const company = req.company;
    if (!company) throw new NotFoundException("Company not found");

    const coverPic = company.coverPic!.find(
      (pic) => pic.public_id === public_id,
    );
    if (!coverPic) throw new NotFoundException("Cover picture not found");

    await cloudinary.uploader.destroy(public_id);

    const updated = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: company._id },
      update: { $pull: { coverPic: { public_id } } },
    });

    if (!updated) {
      throw new BadRequestException("Failed to delete cover picture");
    }

    return res.status(200).json({
      message: "Cover picture deleted successfully",
    });
  };
  exportApplicationsSchema = async (req: Request, res: Response) => {
    const { date } = req.query;

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'Query parameter "date" must be in YYYY-MM-DD format',
      );
    }
    //2026-09-08T18:26:19.776+00:00
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const jobs = await find({
      model: JobModel,
      filter: { companyId: req.company!._id },
    });
    const jobsId = jobs.map((job) => job._id);
    if (jobsId.length === 0)
      throw new NotFoundException("This company has no jobs yet");
    const applications = await find({
      model: ApplicationModel,
      filter: {
        jobId: { $in: jobsId },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
      options: {
        populate: [
          { path: "userId", select: "firstName lastName email" },
          { path: "jobId", select: "jobTitle" },
        ],
      },
    });
    if (applications.length === 0)
      throw new NotFoundException(
        "No applications found for this company on this date",
      );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Applications");
    sheet.columns = [
      { header: "Applicant Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Job Title", key: "jobTitle", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Applied At", key: "appliedAt", width: 22 },
    ];
    applications.forEach((app: any) => {
      sheet.addRow({
        name: `${app.userId?.firstName || ""} ${app.userId?.lastName || ""}`.trim(),
        email: app.userId?.email || "N/A",
        jobTitle: app.jobId?.jobTitle || "N/A",
        status: app.status,
        appliedAt: new Date(app.createdAt).toLocaleString(),
      });
    });
    const fileName = `applications-${date}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  };
}

export default new companyService();
