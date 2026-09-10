"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalHandeler = exports.TooManyRequestsException = exports.ConflictException = exports.ForbiddenException = exports.UnauthorizedException = exports.BadRequestException = exports.NotFoundException = void 0;
const config_service_1 = require("../../config/config.service");
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400, options) {
        super(message, options);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
    }
}
class NotFoundException extends AppError {
    constructor(message, options) {
        super(message, 404, options);
    }
}
exports.NotFoundException = NotFoundException;
class BadRequestException extends AppError {
    constructor(message, options) {
        super(message, 400, options);
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends AppError {
    constructor(message, options) {
        super(message, 401, options);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends AppError {
    constructor(message, options) {
        super(message, 403, options);
    }
}
exports.ForbiddenException = ForbiddenException;
class ConflictException extends AppError {
    constructor(message, options) {
        super(message, 409, options);
    }
}
exports.ConflictException = ConflictException;
class TooManyRequestsException extends AppError {
    constructor(message, options) {
        super(message, 429, options);
    }
}
exports.TooManyRequestsException = TooManyRequestsException;
const globalHandeler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isDev = config_service_1.env.ENV_MODE === "DEVELOPMENT";
    if (statusCode > 500)
        console.log(err);
    res.status(statusCode).json({
        message: err.message,
        ...(isDev && { stack: err.stack }),
        cause: err.cause,
    });
};
exports.globalHandeler = globalHandeler;
