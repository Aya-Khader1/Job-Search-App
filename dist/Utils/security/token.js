"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewLoginCredentials = exports.decodedToken = exports.createLoginCredentials = exports.getSignature = exports.verifyToken = exports.generateToken = exports.TokenTypeEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_enum_1 = require("../enums/user.enum");
const user_model_1 = require("../../DB/Models/user.model");
const config_service_1 = require("../../config/config.service");
const error_response_1 = require("../response/error.response");
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum["ACCESS"] = "ACCESS";
    TokenTypeEnum["REFRESH"] = "REFRESH";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
const generateToken = ({ payload, secretKey, options, }) => {
    return (0, jsonwebtoken_1.sign)(payload, secretKey, options);
};
exports.generateToken = generateToken;
const verifyToken = ({ token, secretKey, }) => {
    return (0, jsonwebtoken_1.verify)(token, secretKey);
};
exports.verifyToken = verifyToken;
const getSignature = ({ signatureLevel = user_enum_1.ROLE.USER, }) => {
    switch (signatureLevel) {
        case user_enum_1.ROLE.ADMIN:
            return {
                accessSignature: config_service_1.env.ACCESS_ADMIN_SIGNATURE,
                refreshSignature: config_service_1.env.REFRESH_ADMIN_SIGNATURE,
            };
        case user_enum_1.ROLE.USER:
        default:
            return {
                accessSignature: config_service_1.env.ACCESS_USER_SIGNATURE,
                refreshSignature: config_service_1.env.REFRESH_USER_SIGNATURE,
            };
    }
};
exports.getSignature = getSignature;
const createLoginCredentials = (user) => {
    const isAdmin = user.role === user_enum_1.ROLE.ADMIN;
    const accessSecret = isAdmin
        ? config_service_1.env.ACCESS_ADMIN_SIGNATURE
        : config_service_1.env.ACCESS_USER_SIGNATURE;
    const refreshSecret = isAdmin
        ? config_service_1.env.REFRESH_ADMIN_SIGNATURE
        : config_service_1.env.REFRESH_USER_SIGNATURE;
    const accessToken = (0, exports.generateToken)({
        payload: { _id: user._id },
        secretKey: accessSecret,
        options: { expiresIn: Number(config_service_1.env.ACCESS_TOKEN_EXPIRES_IN) },
    });
    const refreshToken = (0, exports.generateToken)({
        payload: { _id: user._id },
        secretKey: refreshSecret,
        options: { expiresIn: Number(config_service_1.env.REFRESH_TOKEN_EXPIRES_IN) },
    });
    return { accessToken, refreshToken };
};
exports.createLoginCredentials = createLoginCredentials;
const decodedToken = async ({ authorization, tokenType = TokenTypeEnum.ACCESS, signatureLevel = user_enum_1.ROLE.USER, }) => {
    if (!authorization) {
        throw new error_response_1.UnauthorizedException("Missing authorization header");
    }
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer" || !token) {
        throw new error_response_1.UnauthorizedException("Invalid Authorization Format");
    }
    const signature = (0, exports.getSignature)({ signatureLevel });
    let decoded;
    try {
        const userSignature = (0, exports.getSignature)({ signatureLevel: user_enum_1.ROLE.USER });
        decoded = (0, exports.verifyToken)({
            token,
            secretKey: tokenType === TokenTypeEnum.ACCESS
                ? userSignature.accessSignature
                : userSignature.refreshSignature,
        });
    }
    catch {
        try {
            const adminSignature = (0, exports.getSignature)({ signatureLevel: user_enum_1.ROLE.ADMIN });
            decoded = (0, exports.verifyToken)({
                token,
                secretKey: tokenType === TokenTypeEnum.ACCESS
                    ? adminSignature.accessSignature
                    : adminSignature.refreshSignature,
            });
        }
        catch {
            throw new error_response_1.UnauthorizedException("Invalid Token");
        }
    }
    if (!decoded._id) {
        throw new error_response_1.UnauthorizedException("Invalid token payload");
    }
    const user = await user_model_1.UserModel.findById(decoded._id);
    if (!user) {
        throw new error_response_1.BadRequestException("Account not found");
    }
    if (user.deletedAt) {
        throw new error_response_1.UnauthorizedException("Account has been deleted");
    }
    if (user.bannedAt)
        throw new error_response_1.ForbiddenException("Your account has been banned");
    if (user.changeCredentialTime && decoded.iat) {
        const changeCredentialTimestamp = Math.floor(user.changeCredentialTime.getTime() / 1000);
        if (decoded.iat < changeCredentialTimestamp) {
            throw new error_response_1.UnauthorizedException("Token is no longer valid, please login again");
        }
    }
    return { user, decoded };
};
exports.decodedToken = decodedToken;
const getNewLoginCredentials = (user, type = "LOGIN") => {
    const signature = (0, exports.getSignature)({ signatureLevel: user.role });
    const payload = {
        _id: user._id.toString(),
    };
    const accessToken = (0, exports.generateToken)({
        payload,
        secretKey: signature.accessSignature,
        options: { expiresIn: config_service_1.env.ACCESS_TOKEN_EXPIRES_IN },
    });
    if (type === "REFRESH") {
        return { accessToken };
    }
    const refreshToken = (0, exports.generateToken)({
        payload,
        secretKey: signature.refreshSignature,
        options: { expiresIn: config_service_1.env.REFRESH_TOKEN_EXPIRES_IN },
    });
    return { accessToken, refreshToken };
};
exports.getNewLoginCredentials = getNewLoginCredentials;
