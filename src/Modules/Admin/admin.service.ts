import { Request, Response } from "express";
import { findById, findOneAndUpdate } from "../../DB/db.repository";
import { UserModel } from "../../DB/Models/user.model";
import { IdUserIdParams } from "./admin.dto";
import { BadRequestException } from "../../Utils/response/error.response";
import { IIdCompanyParamsDTO } from "../Company/company.dto";
import { CompanyModel } from "../../DB/Models/company.model";
class adminService {
  banUnbanUser = async (req: Request, res: Response) => {
    const { userId }: IdUserIdParams = req.params as IdUserIdParams;
    const user = await findById({
      model: UserModel,
      id: userId,
    });
    const isBanned = !!user?.bannedAt;
    const updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: userId },
      update: isBanned
        ? { $unset: { bannedAt: "" } }
        : { $set: { bannedAt: new Date() } },
    });
    if (!updatedUser)
      throw new BadRequestException("Failed to update user ban status");

    return res.status(200).json({
      message: isBanned
        ? "User unbanned successfully"
        : "User banned successfully",
    });
  };
  banUnbanCompany = async (req: Request, res: Response) => {
    const { companyId }: IIdCompanyParamsDTO =
      req.params as IIdCompanyParamsDTO;
    const user = await findById({
      model: CompanyModel,
      id: companyId,
    });
    const isBanned = !!user?.bannedAt;
    const updatedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: companyId },
      update: isBanned
        ? { $unset: { bannedAt: "" } }
        : { $set: { bannedAt: new Date() } },
    });
    if (!updatedCompany)
      throw new BadRequestException("Failed to update company ban status");

    return res.status(200).json({
      message: isBanned
        ? "Company unbanned successfully"
        : "Company banned successfully",
    });
  };
  approvedCompany = async (req: Request, res: Response) => {
    const { companyId }: IIdCompanyParamsDTO =
      req.params as IIdCompanyParamsDTO;
    const company = await findById({
      model: CompanyModel,
      id: companyId,
    });
    if (company?.approvedByAdmin === true)
      throw new BadRequestException("Company is already approved");

    const updatedCompany = await findOneAndUpdate({
      model: CompanyModel,
      filter: { _id: companyId },
      update: { $set: { approvedByAdmin: true } },
    });
    if (!updatedCompany)
      throw new BadRequestException("Failed to approve company");

    return res.status(200).json({ message: "Company approved successfully" });
  };
}

export default new adminService();
