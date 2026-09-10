"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_repository_1 = require("../../DB/db.repository");
const company_model_1 = require("../../DB/Models/company.model");
const error_response_1 = require("../../Utils/response/error.response");
const user_enum_1 = require("../../Utils/enums/user.enum");
const cloudinary_config_1 = __importDefault(require("../../config/cloudinary.config"));
const cloudinary_1 = require("../../Utils/upload/cloudinary");
class companyService {
    constructor() { }
    addCompany = async (req, res) => {
        const { companyName, description, industry, address, numberOfEmployees, companyEmail, } = req.body;
        const existingCompany = await (0, db_repository_1.findOne)({
            model: company_model_1.CompanyModel,
            filter: {
                $or: [{ companyName }, { companyEmail }],
            },
        });
        if (existingCompany) {
            throw new error_response_1.ConflictException("Company name or email already exists");
        }
        const newCompany = await (0, db_repository_1.createOne)({
            model: company_model_1.CompanyModel,
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
    updateCompany = async (req, res) => {
        const { companyId } = req.params;
        const { companyName, description, industry, address, numberOfEmployees, companyEmail, } = req.body;
        const existingCompany = await (0, db_repository_1.findOne)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
        });
        if (!existingCompany) {
            throw new error_response_1.NotFoundException("Company not found");
        }
        if (existingCompany.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== user_enum_1.ROLE.ADMIN) {
            throw new error_response_1.ForbiddenException("You are not authorized to update this company");
        }
        const updatedCompany = await (0, db_repository_1.updateOne)({
            model: company_model_1.CompanyModel,
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
            throw new error_response_1.BadRequestException("Failed to update company");
        }
        return res.status(200).json({
            message: "Company updated successfully",
        });
    };
    getSpecificCompany = async (req, res) => {
        const { companyId } = req.params;
        const company = await (0, db_repository_1.find)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
            options: {
                populate: { path: "jobs" },
            },
        });
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        return res.status(200).json({
            message: "Company fetched successfully",
            data: { company },
        });
    };
    searchCompany = async (req, res) => {
        const { name } = req.query;
        if (!name || name.trim() === "")
            throw new error_response_1.BadRequestException("Search name is required");
        const companies = await (0, db_repository_1.find)({
            model: company_model_1.CompanyModel,
            filter: { companyName: { $regex: name, $options: "i" } },
        });
        return res.status(200).json({
            message: "Companies fetched successfully",
            data: { companies },
        });
    };
    deleteCompany = async (req, res) => {
        const { companyId } = req.params;
        const company = await (0, db_repository_1.findOne)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
        });
        if (!company)
            throw new error_response_1.BadRequestException("Company not found");
        const isOwner = company.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === user_enum_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new error_response_1.ForbiddenException("Only the admin or the company owner can perform this action");
        }
        const deletedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
            update: { $set: { deletedAt: new Date() } },
        });
        if (!deletedCompany) {
            throw new error_response_1.BadRequestException("Failed to delete company");
        }
        return res.status(200).json({
            message: "Company deleted successfully",
        });
    };
    uploadLogo = async (req, res) => {
        if (!req.file)
            throw new error_response_1.BadRequestException("No file uploaded");
        const company = req.company;
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        const oldPublicId = company.logo?.public_id || null;
        const { public_id, secure_url } = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, `company/${company._id}/logo-picture`);
        const updatedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: company._id },
            update: { $set: { logo: { public_id, secure_url } } },
        });
        if (!updatedCompany) {
            await cloudinary_config_1.default.uploader.destroy(public_id).catch((err) => {
                console.error("Failed to cleanup orphaned logo upload:", public_id, err);
            });
            throw new error_response_1.BadRequestException("Failed to update logo picture");
        }
        if (oldPublicId) {
            cloudinary_config_1.default.uploader.destroy(oldPublicId).catch((err) => {
                console.error("Failed to delete old logo:", oldPublicId, err);
            });
        }
        return res.status(200).json({
            message: "Logo uploaded successfully",
            data: { logo: { public_id, secure_url } },
        });
    };
    deleteLogo = async (req, res) => {
        const company = req.company;
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        if (!company.logo?.public_id)
            throw new error_response_1.BadRequestException("No logo found for this company");
        const oldPublicId = company.logo.public_id;
        const updatedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: company._id },
            update: { $unset: { logo: "" } },
        });
        if (!updatedCompany)
            throw new error_response_1.BadRequestException("Failed to delete logo");
        cloudinary_config_1.default.uploader.destroy(oldPublicId).catch((err) => {
            console.error("Failed to delete logo from Cloudinary:", oldPublicId, err);
        });
        return res.status(200).json({
            message: "Logo deleted successfully",
        });
    };
    uploadCoverPic = async (req, res) => {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
            throw new error_response_1.BadRequestException("No file uploaded");
        const company = req.company;
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        const coverPics = await Promise.all(req.files.map(async (file) => {
            const { secure_url, public_id } = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, `company/${company._id}/cover-pictures`);
            return { secure_url, public_id };
        }));
        const updatedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: company._id },
            update: {
                $push: {
                    coverPic: { $each: coverPics },
                },
            },
        });
        if (!updatedCompany)
            throw new error_response_1.BadRequestException("Failed to update cover picture");
        return res.status(200).json({
            message: "Cover picture uploaded successfully",
            data: { coverPics },
        });
    };
    deleteCoverPic = async (req, res) => {
        const { public_id } = req.body;
        if (!public_id)
            throw new error_response_1.BadRequestException("public_id is required");
        const company = req.company;
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        const coverPic = company.coverPic.find((pic) => pic.public_id === public_id);
        if (!coverPic)
            throw new error_response_1.NotFoundException("Cover picture not found");
        await cloudinary_config_1.default.uploader.destroy(public_id);
        const updated = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: company._id },
            update: { $pull: { coverPic: { public_id } } },
        });
        if (!updated) {
            throw new error_response_1.BadRequestException("Failed to delete cover picture");
        }
        return res.status(200).json({
            message: "Cover picture deleted successfully",
        });
    };
}
exports.default = new companyService();
