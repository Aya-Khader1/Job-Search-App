import { Request, Response } from "express";
import {
  IConfirmEmailDTO,
  IForgetPasswordDTO,
  ILoginWithGoogleDTO,
  IResetPasswordDTO,
  ISignInDTO,
  ISignUpDTO,
} from "./authentication.dto";
import { OTP_TYPE, UserModel } from "../../DB/Models/user.model";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../Utils/response/error.response";
import { OAuth2Client } from "google-auth-library";

import { generateOTP } from "../../Utils/generateOtp";
import { compareHash, generateHash } from "../../Utils/security/hash";
import { emailEvents } from "./../../Utils/events/email.event";
import {
  createLoginCredentials,
  getNewLoginCredentials,
} from "../../Utils/security/token";
import { PROVIDER } from "../../Utils/enums/user.enum";
import { env } from "../../config/config.service";
class AuthService {
  constructor() {}
  signup = async (req: Request, res: Response) => {
    const { username, email, password, mobileNumber }: ISignUpDTO = req.body;
    const checkUserExists = await UserModel.findOne({ email });
    if (checkUserExists) throw new ConflictException("User already exists");
    const otp = await generateOTP();
    const code = await generateHash(otp);
    const user = await UserModel.create({
      username,
      email,
      password,
      mobileNumber,
      OTP: [
        {
          code,
          type: OTP_TYPE.CONFIRM_EMAIL,
          expiresIn: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
    });
    emailEvents.emit("confirmEmail", { to: email, otp, username });

    return res
      .status(201)
      .json({ message: "User Created Successfully", data: { user } });
  };
  confirmEmail = async (req: Request, res: Response) => {
    const { email, otp }: IConfirmEmailDTO = req.body;
    const user = await UserModel.findOne({
      email,
      OTP: {
        $elemMatch: {
          type: OTP_TYPE.CONFIRM_EMAIL,
          expiresIn: { $gt: new Date() },
        },
      },
      isConfirmed: { $exists: false },
    });

    if (!user || !user.OTP) throw new NotFoundException("Invalid Account");
    const otpRecord = user.OTP!.find((o) => o.type === OTP_TYPE.CONFIRM_EMAIL);

    const isMatch = await compareHash(otp, otpRecord!.code);
    if (!isMatch) throw new BadRequestException("Invalid OTP");
    await UserModel.updateOne(
      { email },
      { isConfirmed: true, $inc: { __v: 1 } },
    );
    return res.status(201).json({ message: "User Confirmed Successfully" });
  };

  login = async (req: Request, res: Response) => {
    const { email, password }: ISignInDTO = req.body;
    const user = await UserModel.findOne({
      email,
      provider: PROVIDER.SYSTEM,
      isConfirmed: true,
      deletedAt: { $exists: false },
    });
    if (!user) throw new NotFoundException("Invalid Account");
    if (!(await compareHash(password, user.password as string)))
      throw new BadRequestException("Invalid Password");
    const credentials = createLoginCredentials(user);

    return res.status(201).json({ message: "Done", data: { credentials } });
  };

  loginWithGoogle = async (req: Request, res: Response) => {
    const { idToken }: ILoginWithGoogleDTO = req.body;

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new BadRequestException("Invalid Google Token");

    const { email, email_verified, given_name, family_name, picture } = payload;
    if (!email_verified) throw new BadRequestException("Email Not Verified");

    const user = await UserModel.findOne({ email });
    if (user) {
      if (user.provider !== PROVIDER.GOOGLE) {
        throw new ConflictException(
          "This email is already registered with a different sign-in method",
        );
      }
      const credentials = getNewLoginCredentials(user);
      return res.status(200).json({
        message: "Login Successfully",
        data: { credentials },
      });
    }

    const newUser = await UserModel.create({
      firstName: given_name,
      lastName: family_name,
      email,
      profilePic: picture ? { secure_url: picture, public_id: "" } : undefined,
      provider: PROVIDER.GOOGLE,
      isConfirmed: true,
    });

    return res.status(201).json({
      message: "Account created successfully, please login to continue",
      data: {
        newUser,
      },
    });
  };
  resendOtp = async (req: Request, res: Response) => {
    const { email }: IForgetPasswordDTO = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new NotFoundException("User Not Found");
    }

    if (user.isConfirmed) {
      throw new BadRequestException("Email is already confirmed");
    }

    const otp: string = generateOTP();
    const hashedOtp = await generateHash(otp);

    await UserModel.updateOne(
      { email },
      {
        $pull: { OTP: { type: OTP_TYPE.CONFIRM_EMAIL } },
      },
    );

    await UserModel.updateOne(
      { email },
      {
        $push: {
          OTP: {
            code: hashedOtp,
            type: OTP_TYPE.CONFIRM_EMAIL,
            expiresIn: new Date(Date.now() + 10 * 60 * 1000),
          },
        },
      },
    );

    emailEvents.emit("confirmEmail", {
      to: email,
      otp,
      username: user.username,
    });

    return res.status(200).json({ message: "Check Your Email" });
  };
  forgetPassword = async (req: Request, res: Response) => {
    const { email }: IForgetPasswordDTO = req.body;
    const otp: string = generateOTP();
    const hashedOtp = await generateHash(otp);
    const user = await UserModel.findOneAndUpdate(
      { email, isConfirmed: true, provider: PROVIDER.SYSTEM },
      {
        $push: {
          OTP: {
            code: hashedOtp,
            type: OTP_TYPE.FORGET_PASSWORD,
            expiresIn: new Date(Date.now() + 10 * 60 * 1000),
          },
        },
      },
      { new: true },
    );

    if (!user) throw new NotFoundException("User Not Found");
    emailEvents.emit("forgetPassword", {
      to: email,
      otp,
      username: user.username,
    });
    return res.status(200).json({ message: "Check Your Inbox" });
  };
  resetPassword = async (req: Request, res: Response) => {
    const { email, otp, newPassword }: IResetPasswordDTO = req.body;
    const user = await UserModel.findOne({
      email,
      provider: PROVIDER.SYSTEM,
      isConfirmed: true,
      OTP: {
        $elemMatch: {
          type: OTP_TYPE.FORGET_PASSWORD,
          expiresIn: { $gt: new Date() },
        },
      },
    });
    if (!user) throw new NotFoundException("Invalid email or OTP has expired");
    const otpRecord = user.OTP?.find(
      (o) => o.type === OTP_TYPE.FORGET_PASSWORD,
    );
    if (!otpRecord) throw new BadRequestException("OTP not found");
    const isMatch = await compareHash(otp, otpRecord.code);
    if (!isMatch) {
      throw new BadRequestException("Invalid OTP");
    }
    await UserModel.updateOne(
      {
        email,
      },
      {
        password: await generateHash(newPassword),
        changeCredentialTime: new Date(),
      },
    );
    return res.status(200).json({ message: "Password reset successfully" });
  };
  refreshToken = (req: Request, res: Response) => {
    const tokens = getNewLoginCredentials(req.user, "REFRESH");
    res.status(200).json({ message: "Done", data: tokens });
  };
}

export default new AuthService();
