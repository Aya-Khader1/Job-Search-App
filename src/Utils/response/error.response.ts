import { NextFunction, Request, Response } from "express";
import { env } from "../../config/config.service";

export interface IError extends Error {
  statusCode?: number;
}
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: Number = 400,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 404, options);
  }
}

export class BadRequestException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 401, options);
  }
}
export class ForbiddenException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 403, options);
  }
}
export class ConflictException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
  }
}
export class TooManyRequestsException extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 429, options);
  }
}
export const globalHandeler = (
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode = err.statusCode || 500;
  const isDev = env.ENV_MODE === "DEVELOPMENT";
  if (statusCode > 500) console.log(err);

  res.status(statusCode).json({
    message: err.message,
    ...(isDev && { stack: err.stack }),
    cause: err.cause,
  });
};
