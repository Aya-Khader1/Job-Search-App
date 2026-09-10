import { Request, Response, NextFunction } from "express";

import { TooManyRequestsException } from "../Utils/response/error.response.js";

type IPRequest = {
  count: number;
  startTime: number;
};

const ipReq: Record<string, IPRequest> = {};
const blockedIps = new Set<string>();
const unBlockersTimers = new Map<string, NodeJS.Timeout>();
const RATE_LIMIT = 3;
const WINDOWS_MS = 60 * 1000;

export const customRateLimiter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    if (!ip) {
      return next();
    }
    const currentTime = Date.now();
    if (blockedIps.has(ip)) {
      throw new TooManyRequestsException(
        "Too Many Requests, please try again later",
      );
    }

    if (!ipReq[ip]) {
      ipReq[ip] = {
        count: 1,
        startTime: currentTime,
      };

      return next();
    }

    const diff = currentTime - ipReq[ip].startTime;

    if (diff < WINDOWS_MS) {
      ipReq[ip].count++;

      if (ipReq[ip].count > RATE_LIMIT) {
        blockedIps.add(ip);

        if (!unBlockersTimers.has(ip)) {
          const timer = setTimeout(() => {
            blockedIps.delete(ip);
            unBlockersTimers.delete(ip);
          }, WINDOWS_MS);

          unBlockersTimers.set(ip, timer);
        }

        throw new TooManyRequestsException(
          "Too Many Requests, please try again later",
        );
      }
    } else {
      ipReq[ip] = {
        count: 1,
        startTime: currentTime,
      };
    }

    return next();
  };
};
