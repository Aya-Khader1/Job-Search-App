import { NextFunction, Request, Response } from "express";
import { ForbiddenException } from "../Utils/response/error.response";
import { ROLE } from "../Utils/enums/user.enum";
import { decodedToken, TokenTypeEnum } from "../Utils/security/token";

export const authentication = ({
  tokenType = TokenTypeEnum.ACCESS,
}: {
  tokenType?: TokenTypeEnum;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user, decoded } = await decodedToken({
      authorization: req.headers.authorization,
      tokenType,
    });
    req.user = user;
    req.decoded = decoded;

    return next();
  };
};

export const authorization = ({
  accessRoles = [],
}: {
  accessRoles?: ROLE[];
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user.role))
      throw new ForbiddenException("Unauthorized Access");
    return next();
  };
};
