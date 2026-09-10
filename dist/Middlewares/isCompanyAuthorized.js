"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompanyAuthorized = void 0;
const db_repository_1 = require("../DB/db.repository");
const error_response_1 = require("../Utils/response/error.response");
const company_model_1 = require("../DB/Models/company.model");
const user_enum_1 = require("../Utils/enums/user.enum");
const isCompanyAuthorized = (allowed) => {
    return async (req, res, next) => {
        try {
            const { companyId } = req.params;
            const company = await (0, db_repository_1.findOne)({
                model: company_model_1.CompanyModel,
                filter: { _id: companyId },
            });
            if (!company) {
                throw new error_response_1.NotFoundException("Company not found");
            }
            const userId = req.user._id.toString();
            const isOwner = company.createdBy.toString() === userId;
            const isHR = company.HRs?.some((hrId) => hrId.toString() === userId);
            const isAdmin = req.user.role === user_enum_1.ROLE.ADMIN;
            const isAllowed = isAdmin ||
                (allowed.owner === true && isOwner) ||
                (allowed.hr === true && isHR);
            if (!isAllowed) {
                throw new error_response_1.ForbiddenException("You are not authorized to perform this action");
            }
            req.company = company;
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.isCompanyAuthorized = isCompanyAuthorized;
