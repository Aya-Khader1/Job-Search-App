"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customRateLimiter = void 0;
const error_response_js_1 = require("../Utils/response/error.response.js");
const ipReq = {};
const blockedIps = new Set();
const unBlockersTimers = new Map();
const RATE_LIMIT = 3;
const WINDOWS_MS = 60 * 1000;
const customRateLimiter = () => {
    return (req, res, next) => {
        const ip = req.ip;
        if (!ip) {
            return next();
        }
        const currentTime = Date.now();
        if (blockedIps.has(ip)) {
            throw new error_response_js_1.TooManyRequestsException("Too Many Requests, please try again later");
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
                throw new error_response_js_1.TooManyRequestsException("Too Many Requests, please try again later");
            }
        }
        else {
            ipReq[ip] = {
                count: 1,
                startTime: currentTime,
            };
        }
        return next();
    };
};
exports.customRateLimiter = customRateLimiter;
