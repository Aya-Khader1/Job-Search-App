import { NextFunction, Response, Request } from "express";
import { findOne } from "../DB/db.repository";
import { IIdCompanyParamsDTO } from "../Modules/Company/company.dto";
import {
  ForbiddenException,
  NotFoundException,
} from "../Utils/response/error.response";
import { CompanyModel } from "../DB/Models/company.model";
import { ROLE } from "../Utils/enums/user.enum";

export const isCompanyAuthorized = (allowed: {
  owner?: boolean;
  hr?: boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params as IIdCompanyParamsDTO;

      const company = await findOne({
        model: CompanyModel,
        filter: { _id: companyId },
      });

      if (!company) {
        throw new NotFoundException("Company not found");
      }

      const userId = req.user._id.toString();

      const isOwner = company.createdBy.toString() === userId;
      const isHR = company.HRs?.some((hrId) => hrId.toString() === userId);
      const isAdmin = req.user.role === ROLE.ADMIN;

      const isAllowed =
        isAdmin ||
        (allowed.owner === true && isOwner) ||
        (allowed.hr === true && isHR);

      if (!isAllowed) {
        throw new ForbiddenException(
          "You are not authorized to perform this action",
        );
      }

      req.company = company;
      next();
    } catch (err) {
      next(err);
    }
  };
};
