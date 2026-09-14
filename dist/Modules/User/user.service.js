"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../../Utils/security/encryption");
const db_repository_1 = require("../../DB/db.repository");
const user_model_1 = require("../../DB/Models/user.model");
const error_response_1 = require("../../Utils/response/error.response");
const hash_1 = require("../../Utils/security/hash");
const user_enum_1 = require("../../Utils/enums/user.enum");
const cloudinary_config_1 = __importDefault(require("../../config/cloudinary.config"));
const cloudinary_1 = require("../../Utils/upload/cloudinary");
class userService {
    updateProfile = async (req, res) => {
        const { user } = req;
        const { mobileNumber, DOB, firstName, lastName, gender, } = req.body;
        if (mobileNumber !== undefined)
            user.mobileNumber = (0, encryption_1.encrypt)(mobileNumber);
        const update = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(mobileNumber && { mobileNumber }),
            ...(DOB && { DOB }),
            ...(gender && { gender }),
        };
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: {
                _id: user._id,
            },
            update,
            options: { new: true },
        });
        if (!updatedUser) {
            throw new error_response_1.NotFoundException("User not found");
        }
        return res
            .status(200)
            .json({ message: "Updated Profile", data: { updatedUser } });
    };
    getLoginUser = async (req, res) => {
        const user = await (0, db_repository_1.findById)({
            model: user_model_1.UserModel,
            id: req.user._id,
        });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        return res.status(200).json({
            message: "User profile retrieved successfully",
            data: { user },
        });
    };
    getUserProfile = async (req, res) => {
        const { userId } = req.params;
        const loginUser = await (0, db_repository_1.findById)({
            model: user_model_1.UserModel,
            id: req.user._id,
        });
        if (!loginUser) {
            throw new error_response_1.NotFoundException("Logged-in user not found");
        }
        const user = await (0, db_repository_1.findOne)({
            model: user_model_1.UserModel,
            filter: { _id: userId },
            select: " mobileNumber profilePic coverPic -_id",
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User not found");
        }
        return res.status(200).json({
            message: "User Profile",
            data: { user },
        });
    };
    updatePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const user = await (0, db_repository_1.findById)({
            model: user_model_1.UserModel,
            id: req.user._id,
            filter: { provider: user_enum_1.PROVIDER.SYSTEM },
        });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        if (!user.password)
            throw new error_response_1.BadRequestException("This account uses Google sign-in and has no password");
        if (!(await (0, hash_1.compareHash)(oldPassword, user.password)))
            throw new error_response_1.BadRequestException("Old password is incorrect");
        await (0, db_repository_1.updateOne)({
            model: user_model_1.UserModel,
            filter: { _id: user._id },
            update: {
                password: await (0, hash_1.generateHash)(newPassword),
                changeCredentialTime: Date.now(),
            },
        });
        return res.status(200).json({
            message: "Password updated successfully",
        });
    };
    uploadProfilePic = async (req, res) => {
        if (!req.file)
            throw new error_response_1.BadRequestException("No file uploaded");
        const user = await (0, db_repository_1.findById)({ model: user_model_1.UserModel, id: req.user._id });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        if (user.profilePic?.public_id) {
            await cloudinary_config_1.default.uploader.destroy(user.profilePic.public_id);
        }
        const { public_id, secure_url } = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, `users/${req.user._id}/profile-pictures`);
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: req.user._id },
            update: { profilePic: { public_id, secure_url } },
        });
        if (!updatedUser)
            throw new error_response_1.BadRequestException("Failed to update profile picture");
        return res.status(200).json({
            message: "Profile picture uploaded successfully",
            data: { profilePic: { public_id, secure_url } },
        });
    };
    uploadCoverPic = async (req, res) => {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
            throw new error_response_1.BadRequestException("No file uploaded");
        const user = await (0, db_repository_1.findById)({ model: user_model_1.UserModel, id: req.user._id });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        const coverPics = await Promise.all(req.files.map(async (file) => {
            const { secure_url, public_id } = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, `users/${req.user._id}/cover-pictures`);
            return {
                secure_url,
                public_id,
            };
        }));
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: req.user._id },
            update: {
                $push: {
                    coverPic: { $each: coverPics },
                },
            },
        });
        if (!updatedUser)
            throw new error_response_1.BadRequestException("Failed to update cover picture");
        return res.status(200).json({
            message: "Cover picture uploaded successfully",
            data: { coverPics },
        });
    };
    deleteProfilePic = async (req, res) => {
        const user = await (0, db_repository_1.findById)({ model: user_model_1.UserModel, id: req.user._id });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        if (!user.profilePic?.public_id) {
            throw new error_response_1.BadRequestException("No profile picture found");
        }
        const oldPublicId = user.profilePic.public_id;
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: req.user._id },
            update: { profilePic: { public_id: null, secure_url: null } },
        });
        if (!updatedUser)
            throw new error_response_1.BadRequestException("Failed to delete profile picture");
        cloudinary_config_1.default.uploader.destroy(oldPublicId).catch((err) => {
            console.error("Failed to delete profile picture from Cloudinary:", oldPublicId, err);
        });
        return res.status(200).json({
            message: "Profile picture deleted successfully",
        });
    };
    deleteCoverPic = async (req, res) => {
        const { public_id } = req.body;
        if (!public_id)
            throw new error_response_1.BadRequestException("public_id is required");
        const user = await (0, db_repository_1.findById)({
            model: user_model_1.UserModel,
            id: req.user._id,
        });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        const coverPic = user.coverPic.find((pic) => pic.public_id === public_id);
        if (!coverPic)
            throw new error_response_1.NotFoundException("Cover picture not found");
        await cloudinary_config_1.default.uploader.destroy(public_id);
        const updated = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: req.user._id },
            update: { $pull: { coverPic: { public_id } } },
        });
        if (!updated) {
            throw new error_response_1.BadRequestException("Failed to delete cover picture");
        }
        return res.status(200).json({
            message: "Cover picture deleted successfully",
        });
    };
    softDeleteAccount = async (req, res) => {
        const user = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: { _id: req.user._id },
            update: { deletedAt: new Date() },
        });
        if (!user)
            throw new error_response_1.BadRequestException("User not found");
        return res.status(200).json({
            message: "Account deleted successfully",
        });
    };
}
exports.default = new userService();
