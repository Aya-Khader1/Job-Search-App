"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/Models/user.model");
const error_response_1 = require("../../Utils/response/error.response");
const google_auth_library_1 = require("google-auth-library");
const generateOtp_1 = require("../../Utils/generateOtp");
const hash_1 = require("../../Utils/security/hash");
const email_event_1 = require("./../../Utils/events/email.event");
const token_1 = require("../../Utils/security/token");
const user_enum_1 = require("../../Utils/enums/user.enum");
const config_service_1 = require("../../config/config.service");
class AuthService {
    constructor() { }
    signup = async (req, res) => {
        const { username, email, password, mobileNumber } = req.body;
        const checkUserExists = await user_model_1.UserModel.findOne({ email });
        if (checkUserExists)
            throw new error_response_1.ConflictException("User already exists");
        const otp = await (0, generateOtp_1.generateOTP)();
        const code = await (0, hash_1.generateHash)(otp);
        const user = await user_model_1.UserModel.create({
            username,
            email,
            password,
            mobileNumber,
            OTP: [
                {
                    code,
                    type: user_model_1.OTP_TYPE.CONFIRM_EMAIL,
                    expiresIn: new Date(Date.now() + 10 * 60 * 1000),
                },
            ],
        });
        email_event_1.emailEvents.emit("confirmEmail", { to: email, otp, username });
        return res
            .status(201)
            .json({ message: "User Created Successfully", data: { user } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await user_model_1.UserModel.findOne({
            email,
            OTP: {
                $elemMatch: {
                    type: user_model_1.OTP_TYPE.CONFIRM_EMAIL,
                    expiresIn: { $gt: new Date() },
                },
            },
            isConfirmed: { $exists: false },
        });
        if (!user || !user.OTP)
            throw new error_response_1.NotFoundException("Invalid Account");
        const otpRecord = user.OTP.find((o) => o.type === user_model_1.OTP_TYPE.CONFIRM_EMAIL);
        const isMatch = await (0, hash_1.compareHash)(otp, otpRecord.code);
        if (!isMatch)
            throw new error_response_1.BadRequestException("Invalid OTP");
        await user_model_1.UserModel.updateOne({ email }, { isConfirmed: true, $inc: { __v: 1 } });
        return res.status(201).json({ message: "User Confirmed Successfully" });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await user_model_1.UserModel.findOne({
            email,
            provider: user_enum_1.PROVIDER.SYSTEM,
            isConfirmed: true,
            deletedAt: { $exists: false },
        });
        if (!user)
            throw new error_response_1.NotFoundException("Invalid Account");
        if (!(await (0, hash_1.compareHash)(password, user.password)))
            throw new error_response_1.BadRequestException("Invalid Password");
        const credentials = (0, token_1.createLoginCredentials)(user);
        return res.status(201).json({ message: "Done", data: { credentials } });
    };
    loginWithGoogle = async (req, res) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_service_1.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload)
            throw new error_response_1.BadRequestException("Invalid Google Token");
        const { email, email_verified, given_name, family_name, picture } = payload;
        if (!email_verified)
            throw new error_response_1.BadRequestException("Email Not Verified");
        const user = await user_model_1.UserModel.findOne({ email });
        if (user) {
            if (user.provider !== user_enum_1.PROVIDER.GOOGLE) {
                throw new error_response_1.ConflictException("This email is already registered with a different sign-in method");
            }
            const credentials = (0, token_1.getNewLoginCredentials)(user);
            return res.status(200).json({
                message: "Login Successfully",
                data: { credentials },
            });
        }
        const newUser = await user_model_1.UserModel.create({
            firstName: given_name,
            lastName: family_name,
            email,
            profilePic: picture ? { secure_url: picture, public_id: "" } : undefined,
            provider: user_enum_1.PROVIDER.GOOGLE,
            isConfirmed: true,
        });
        return res.status(201).json({
            message: "Account created successfully, please login to continue",
            data: {
                newUser,
            },
        });
    };
    resendOtp = async (req, res) => {
        const { email } = req.body;
        const user = await user_model_1.UserModel.findOne({ email });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Found");
        }
        if (user.isConfirmed) {
            throw new error_response_1.BadRequestException("Email is already confirmed");
        }
        const otp = (0, generateOtp_1.generateOTP)();
        const hashedOtp = await (0, hash_1.generateHash)(otp);
        await user_model_1.UserModel.updateOne({ email }, {
            $pull: { OTP: { type: user_model_1.OTP_TYPE.CONFIRM_EMAIL } },
        });
        await user_model_1.UserModel.updateOne({ email }, {
            $push: {
                OTP: {
                    code: hashedOtp,
                    type: user_model_1.OTP_TYPE.CONFIRM_EMAIL,
                    expiresIn: new Date(Date.now() + 10 * 60 * 1000),
                },
            },
        });
        email_event_1.emailEvents.emit("confirmEmail", {
            to: email,
            otp,
            username: user.username,
        });
        return res.status(200).json({ message: "Check Your Email" });
    };
    forgetPassword = async (req, res) => {
        const { email } = req.body;
        const otp = (0, generateOtp_1.generateOTP)();
        const hashedOtp = await (0, hash_1.generateHash)(otp);
        const user = await user_model_1.UserModel.findOneAndUpdate({ email, isConfirmed: true, provider: user_enum_1.PROVIDER.SYSTEM }, {
            $push: {
                OTP: {
                    code: hashedOtp,
                    type: user_model_1.OTP_TYPE.FORGET_PASSWORD,
                    expiresIn: new Date(Date.now() + 10 * 60 * 1000),
                },
            },
        }, { new: true });
        if (!user)
            throw new error_response_1.NotFoundException("User Not Found");
        email_event_1.emailEvents.emit("forgetPassword", {
            to: email,
            otp,
            username: user.username,
        });
        return res.status(200).json({ message: "Check Your Inbox" });
    };
    resetPassword = async (req, res) => {
        const { email, otp, newPassword } = req.body;
        const user = await user_model_1.UserModel.findOne({
            email,
            provider: user_enum_1.PROVIDER.SYSTEM,
            isConfirmed: true,
            OTP: {
                $elemMatch: {
                    type: user_model_1.OTP_TYPE.FORGET_PASSWORD,
                    expiresIn: { $gt: new Date() },
                },
            },
        });
        if (!user)
            throw new error_response_1.NotFoundException("Invalid email or OTP has expired");
        const otpRecord = user.OTP?.find((o) => o.type === user_model_1.OTP_TYPE.FORGET_PASSWORD);
        if (!otpRecord)
            throw new error_response_1.BadRequestException("OTP not found");
        const isMatch = await (0, hash_1.compareHash)(otp, otpRecord.code);
        if (!isMatch) {
            throw new error_response_1.BadRequestException("Invalid OTP");
        }
        await user_model_1.UserModel.updateOne({
            email,
        }, {
            password: await (0, hash_1.generateHash)(newPassword),
            changeCredentialTime: new Date(),
        });
        return res.status(200).json({ message: "Password reset successfully" });
    };
    refreshToken = (req, res) => {
        const tokens = (0, token_1.getNewLoginCredentials)(req.user, "REFRESH");
        res.status(200).json({ message: "Done", data: tokens });
    };
}
exports.default = new AuthService();
