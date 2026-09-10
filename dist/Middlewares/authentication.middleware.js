"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authentication = void 0;
const error_response_1 = require("../Utils/response/error.response");
const token_1 = require("../Utils/security/token");
const authentication = ({ tokenType = token_1.TokenTypeEnum.ACCESS, }) => {
    return async (req, res, next) => {
        const { user, decoded } = await (0, token_1.decodedToken)({
            authorization: req.headers.authorization,
            tokenType,
        });
        req.user = user;
        req.decoded = decoded;
        return next();
    };
};
exports.authentication = authentication;
const authorization = ({ accessRoles = [], }) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role))
            throw new error_response_1.ForbiddenException("Unauthorized Access");
        return next();
    };
};
exports.authorization = authorization;
