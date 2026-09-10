import { Secret, sign, SignOptions, verify, JwtPayload } from "jsonwebtoken";
import { ROLE } from "../enums/user.enum";
import { HUserDocument, IUser, UserModel } from "../../DB/Models/user.model";
import { env } from "../../config/config.service";
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from "../response/error.response";
import { v4 as uuid } from "uuid";
export interface IPayloadToken extends JwtPayload {
  _id: string;
  role: ROLE;
}
export enum TokenTypeEnum {
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
}
export const generateToken = ({
  payload,
  secretKey,
  options,
}: {
  payload: object;
  secretKey: Secret;
  options: SignOptions;
}) => {
  return sign(payload, secretKey, options);
};

export const verifyToken = ({
  token,
  secretKey,
}: {
  token: string;
  secretKey: Secret;
}): IPayloadToken => {
  return verify(token, secretKey) as IPayloadToken;
};
export const getSignature = ({
  signatureLevel = ROLE.USER,
}: {
  signatureLevel?: ROLE;
}) => {
  switch (signatureLevel) {
    case ROLE.ADMIN:
      return {
        accessSignature: env.ACCESS_ADMIN_SIGNATURE,
        refreshSignature: env.REFRESH_ADMIN_SIGNATURE,
      };

    case ROLE.USER:
    default:
      return {
        accessSignature: env.ACCESS_USER_SIGNATURE,
        refreshSignature: env.REFRESH_USER_SIGNATURE,
      };
  }
};
export const createLoginCredentials = (
  user: HUserDocument,
): { accessToken: string; refreshToken: string } => {
  const isAdmin = user.role === ROLE.ADMIN;
  const accessSecret = isAdmin
    ? env.ACCESS_ADMIN_SIGNATURE
    : env.ACCESS_USER_SIGNATURE;

  const refreshSecret = isAdmin
    ? env.REFRESH_ADMIN_SIGNATURE
    : env.REFRESH_USER_SIGNATURE;

  const accessToken = generateToken({
    payload: { _id: user._id },
    secretKey: accessSecret,
    options: { expiresIn: Number(env.ACCESS_TOKEN_EXPIRES_IN) },
  });
  const refreshToken = generateToken({
    payload: { _id: user._id },
    secretKey: refreshSecret,
    options: { expiresIn: Number(env.REFRESH_TOKEN_EXPIRES_IN) },
  });

  return { accessToken, refreshToken };
};
export const decodedToken = async ({
  authorization,
  tokenType = TokenTypeEnum.ACCESS,
  signatureLevel = ROLE.USER,
}: {
  authorization: string | undefined;
  tokenType?: TokenTypeEnum;
  signatureLevel?: ROLE;
}): Promise<{ user: HUserDocument; decoded: IPayloadToken }> => {
  if (!authorization) {
    throw new UnauthorizedException("Missing authorization header");
  }

  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer" || !token) {
    throw new UnauthorizedException("Invalid Authorization Format");
  }

  const signature = getSignature({ signatureLevel });

  let decoded: IPayloadToken;
  try {
    const userSignature = getSignature({ signatureLevel: ROLE.USER });
    decoded = verifyToken({
      token,
      secretKey:
        tokenType === TokenTypeEnum.ACCESS
          ? userSignature.accessSignature
          : userSignature.refreshSignature,
    });
  } catch {
    try {
      const adminSignature = getSignature({ signatureLevel: ROLE.ADMIN });
      decoded = verifyToken({
        token,
        secretKey:
          tokenType === TokenTypeEnum.ACCESS
            ? adminSignature.accessSignature
            : adminSignature.refreshSignature,
      });
    } catch {
      throw new UnauthorizedException("Invalid Token");
    }
  }

  if (!decoded._id) {
    throw new UnauthorizedException("Invalid token payload");
  }

  const user = await UserModel.findById(decoded._id);
  if (!user) {
    throw new BadRequestException("Account not found");
  }
  if (user.deletedAt) {
    throw new UnauthorizedException("Account has been deleted");
  }

  if (user.bannedAt)
    throw new ForbiddenException("Your account has been banned");
  if (user.changeCredentialTime && decoded.iat) {
    const changeCredentialTimestamp = Math.floor(
      user.changeCredentialTime.getTime() / 1000,
    );
    if (decoded.iat < changeCredentialTimestamp) {
      throw new UnauthorizedException(
        "Token is no longer valid, please login again",
      );
    }
  }

  return { user, decoded };
};
export const getNewLoginCredentials = (
  user: HUserDocument,
  type: "LOGIN" | "REFRESH" = "LOGIN",
): { accessToken: string; refreshToken?: string } => {
  const signature = getSignature({ signatureLevel: user.role });

  const payload: Pick<IPayloadToken, "_id"> = {
    _id: user._id.toString(),
  };

  const accessToken = generateToken({
    payload,
    secretKey: signature.accessSignature,
    options: { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any },
  });

  if (type === "REFRESH") {
    return { accessToken };
  }

  const refreshToken = generateToken({
    payload,
    secretKey: signature.refreshSignature,
    options: { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any },
  });

  return { accessToken, refreshToken };
};
