"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../../Utils/security/encryption");
const db_repository_1 = require("../../DB/db.repository");
const user_model_1 = require("../../DB/Models/user.model");
const error_response_1 = require("../../Utils/response/error.response");
const hash_1 = require("../../Utils/security/hash");
const user_enum_1 = require("../../Utils/enums/user.enum");
const cloudinary_1 = require("../../Utils/upload/cloudinary");
class userService {
    updateProfile = async (req, res) => {
        const { user } = req;
        const { mobileNumber, DOB, firstName, lastName, gender, } = req.body;
        if (mobileNumber !== undefined)
            user.mobileNumber = (0, encryption_1.encrypt)(mobileNumber);
        const updatedUser = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: {
                _id: user._id,
            },
            update: {
                mobileNumber: user.mobileNumber,
                DOB,
                firstName,
                lastName,
                gender,
            },
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
            message: "Updated Profile",
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
            select: "firstName lastName mobileNumber profilePic coverPic -_id",
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
        const { public_id, secure_url } = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, `users/${req.user._id}/profile-pictures`);
        if (!public_id || !secure_url)
            throw new error_response_1.BadRequestException("Failed to upload profile picture");
        const user = await (0, db_repository_1.findOneAndUpdate)({
            model: user_model_1.UserModel,
            filter: {
                _id: req.user._id,
            },
            update: {
                profilePic: {
                    public_id,
                    secure_url,
                },
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("User not found");
        }
        return res.status(200).json({
            message: "Profile picture uploaded successfully",
            profilePic: {
                public_id,
                secure_url,
            },
        });
    };
}
exports.default = new userService();
