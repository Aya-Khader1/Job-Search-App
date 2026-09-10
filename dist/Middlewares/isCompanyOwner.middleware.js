"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompanyOwner = void 0;
const db_repository_1 = require("../DB/db.repository");
const company_model_1 = require("../DB/Models/company.model");
const error_response_1 = require("../Utils/response/error.response");
const user_enum_1 = require("../Utils/enums/user.enum");
const isCompanyOwner = async (req, res, next) => {
    const { companyId } = req.params;
    const company = await (0, db_repository_1.findOne)({
        model: company_model_1.CompanyModel,
        filter: { _id: companyId },
    });
    if (!company)
        throw new error_response_1.NotFoundException("Company not found");
    if (company.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== user_enum_1.ROLE.ADMIN)
        throw new error_response_1.ForbiddenException("Only the company owner or admin can perform this action");
    req.company = company;
    next();
};
exports.isCompanyOwner = isCompanyOwner;
