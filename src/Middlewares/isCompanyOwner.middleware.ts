import { NextFunction, Request, Response } from "express";
import { IIdCompanyParamsDTO } from "../Modules/Company/company.dto";
import { findOne } from "../DB/db.repository";
import { CompanyModel } from "../DB/Models/company.model";
import {
  ForbiddenException,
  NotFoundException,
} from "../Utils/response/error.response";
import { ROLE } from "../Utils/enums/user.enum";

export const isCompanyOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { companyId } = req.params as IIdCompanyParamsDTO;
  const company = await findOne({
    model: CompanyModel,
    filter: { _id: companyId },
  });
  if (!company) throw new NotFoundException("Company not found");
  if (
    company.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== ROLE.ADMIN
  )
    throw new ForbiddenException(
      "Only the company owner or admin can perform this action",
    );
  req.company = company;
  next();
};
