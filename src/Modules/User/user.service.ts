import { Request, Response } from "express";
import {
  IIdParamsDTO,
  IUpdatePasswordDto,
  IUpdateProfileDTO,
} from "./user.dto";
import { decrypt, encrypt } from "../../Utils/security/encryption";
import {
  findById,
  findOne,
  findOneAndUpdate,
  updateOne,
} from "../../DB/db.repository";
import { UserModel } from "../../DB/Models/user.model";
import {
  BadRequestException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { compareHash, generateHash } from "../../Utils/security/hash";
import { PROVIDER } from "../../Utils/enums/user.enum";
import cloudinary from "../../config/cloudinary.config";
import { uploadToCloudinary } from "../../Utils/upload/cloudinary";

class userService {
  updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const { user } = req;
    const {
      mobileNumber,
      DOB,
      firstName,
      lastName,
      gender,
    }: IUpdateProfileDTO = req.body;
    if (mobileNumber !== undefined) user.mobileNumber = encrypt(mobileNumber);
    const update = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(mobileNumber && { mobileNumber }),
      ...(DOB && { DOB }),
      ...(gender && { gender }),
    };
    const updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: {
        _id: user._id,
      },
      update,
      options: { new: true },
    });
    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }
    return res
      .status(200)
      .json({ message: "Updated Profile", data: { updatedUser } });
  };
  getLoginUser = async (req: Request, res: Response): Promise<Response> => {
    const user = await findById({
      model: UserModel,
      id: req.user!._id,
    });
    if (!user) throw new NotFoundException("User not found");

    return res.status(200).json({
      message: "User profile retrieved successfully",
      data: { user },
    });
  };
  getUserProfile = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IIdParamsDTO;

    const loginUser = await findById({
      model: UserModel,
      id: req.user!._id,
    });

    if (!loginUser) {
      throw new NotFoundException("Logged-in user not found");
    }

    const user = await findOne({
      model: UserModel,
      filter: { _id: userId },
      select: " mobileNumber profilePic coverPic -_id",
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return res.status(200).json({
      message: "User Profile",
      data: { user },
    });
  };
  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    const { oldPassword, newPassword }: IUpdatePasswordDto = req.body;
    const user = await findById({
      model: UserModel,
      id: req.user!._id,
      filter: { provider: PROVIDER.SYSTEM },
    });
    if (!user) throw new NotFoundException("User not found");
    if (!user.password)
      throw new BadRequestException(
        "This account uses Google sign-in and has no password",
      );
    if (!(await compareHash(oldPassword, user.password)))
      throw new BadRequestException("Old password is incorrect");
    await updateOne({
      model: UserModel,
      filter: { _id: user._id },
      update: {
        password: await generateHash(newPassword),
        changeCredentialTime: Date.now(),
      },
    });
    return res.status(200).json({
      message: "Password updated successfully",
    });
  };
  uploadProfilePic = async (req: Request, res: Response): Promise<Response> => {
    if (!req.file) throw new BadRequestException("No file uploaded");

    const user = await findById({ model: UserModel, id: req.user._id });
    if (!user) throw new NotFoundException("User not found");

    if (user.profilePic?.public_id) {
      await cloudinary.uploader.destroy(user.profilePic.public_id);
    }

    const { public_id, secure_url } = await uploadToCloudinary(
      req.file.buffer,
      `users/${req.user._id}/profile-pictures`,
    );

    const updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      update: { profilePic: { public_id, secure_url } },
    });

    if (!updatedUser)
      throw new BadRequestException("Failed to update profile picture");

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      data: { profilePic: { public_id, secure_url } },
    });
  };
  uploadCoverPic = async (req: Request, res: Response): Promise<Response> => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
      throw new BadRequestException("No file uploaded");

    const user = await findById({ model: UserModel, id: req.user._id });
    if (!user) throw new NotFoundException("User not found");
    const coverPics = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const { secure_url, public_id } = await uploadToCloudinary(
          file.buffer,
          `users/${req.user._id}/cover-pictures`,
        );

        return {
          secure_url,
          public_id,
        };
      }),
    );

    const updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      update: {
        $push: {
          coverPic: { $each: coverPics },
        },
      },
    });

    if (!updatedUser)
      throw new BadRequestException("Failed to update cover picture");

    return res.status(200).json({
      message: "Cover picture uploaded successfully",
      data: { coverPics },
    });
  };
  deleteProfilePic = async (req: Request, res: Response): Promise<Response> => {
    const user = await findById({ model: UserModel, id: req.user._id });
    if (!user) throw new NotFoundException("User not found");

    if (!user.profilePic?.public_id) {
      throw new BadRequestException("No profile picture found");
    }

    const oldPublicId = user.profilePic.public_id;

    const updatedUser = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      update: { profilePic: { public_id: null, secure_url: null } },
    });

    if (!updatedUser)
      throw new BadRequestException("Failed to delete profile picture");

    cloudinary.uploader.destroy(oldPublicId).catch((err) => {
      console.error(
        "Failed to delete profile picture from Cloudinary:",
        oldPublicId,
        err,
      );
    });

    return res.status(200).json({
      message: "Profile picture deleted successfully",
    });
  };
  deleteCoverPic = async (req: Request, res: Response): Promise<Response> => {
    const { public_id } = req.body;
    if (!public_id) throw new BadRequestException("public_id is required");

    const user = await findById({
      model: UserModel,
      id: req.user._id,
    });
    if (!user) throw new NotFoundException("User not found");

    const coverPic = user.coverPic.find((pic) => pic.public_id === public_id);
    if (!coverPic) throw new NotFoundException("Cover picture not found");
    await cloudinary.uploader.destroy(public_id);

    const updated = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      update: { $pull: { coverPic: { public_id } } },
    });
    if (!updated) {
      throw new BadRequestException("Failed to delete cover picture");
    }

    return res.status(200).json({
      message: "Cover picture deleted successfully",
    });
  };

  softDeleteAccount = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const user = await findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      update: { deletedAt: new Date() },
    });

    if (!user) throw new BadRequestException("User not found");

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  };
}

export default new userService();
