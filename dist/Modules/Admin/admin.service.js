"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_repository_1 = require("../../DB/db.repository");
const user_model_1 = require("../../DB/Models/user.model");
const error_response_1 = require("../../Utils/response/error.response");
const company_model_1 = require("../../DB/Models/company.model");
class adminService {
    banUnbanUser = async (req, res) => {
        const { userId } = req.params;
        const user = await (0, db_repository_1.findById)({
            model: user_model_1.UserModel,
            id: userId,
        });
        const isBanned = !!user?.bannedAt;
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: userId },
            update: isBanned
                ? { $unset: { bannedAt: "" } }
                : { $set: { bannedAt: new Date() } },
        });
        if (!updatedUser)
            throw new error_response_1.BadRequestException("Failed to update user ban status");
        return res.status(200).json({
            message: isBanned
                ? "User unbanned successfully"
                : "User banned successfully",
        });
    };
    banUnbanCompany = async (req, res) => {
        const { companyId } = req.params;
        const user = await (0, db_repository_1.findById)({
            model: company_model_1.CompanyModel,
            id: companyId,
        });
        const isBanned = !!user?.bannedAt;
        const updatedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
            update: isBanned
                ? { $unset: { bannedAt: "" } }
                : { $set: { bannedAt: new Date() } },
        });
        if (!updatedCompany)
            throw new error_response_1.BadRequestException("Failed to update company ban status");
        return res.status(200).json({
            message: isBanned
                ? "Company unbanned successfully"
                : "Company banned successfully",
        });
    };
    approvedCompany = async (req, res) => {
        const { companyId } = req.params;
        const company = await (0, db_repository_1.findById)({
            model: company_model_1.CompanyModel,
            id: companyId,
        });
        if (company?.approvedByAdmin === true)
            throw new error_response_1.BadRequestException("Company is already approved");
        const updatedCompany = await (0, db_repository_1.findOneAndUpdate)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
            update: { $set: { approvedByAdmin: true } },
        });
        if (!updatedCompany)
            throw new error_response_1.BadRequestException("Failed to approve company");
        return res.status(200).json({ message: "Company approved successfully" });
    };
}
exports.default = new adminService();
