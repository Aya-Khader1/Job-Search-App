"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompanyOwnerOrHR = void 0;
const db_repository_1 = require("../DB/db.repository");
const company_model_1 = require("../DB/Models/company.model");
const error_response_1 = require("../Utils/response/error.response");
const user_enum_1 = require("../Utils/enums/user.enum");
const isCompanyOwnerOrHR = async (req, res, next) => {
    try {
        const { companyId } = req.params;
        const company = await (0, db_repository_1.findOne)({
            model: company_model_1.CompanyModel,
            filter: { _id: companyId },
        });
        if (!company)
            throw new error_response_1.NotFoundException("Company not found");
        const isOwner = company.createdBy.toString() === req.user._id.toString();
        const isHR = company.HRs?.some((hrId) => hrId.toString() === req.user._id.toString());
        const isAdmin = req.user.role === user_enum_1.ROLE.ADMIN;
        if (!isOwner && !isHR && !isAdmin)
            throw new error_response_1.ForbiddenException("Only company owner, HR, or admin can perform this action");
        req.company = company;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.isCompanyOwnerOrHR = isCompanyOwnerOrHR;
