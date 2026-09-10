"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionCors = void 0;
const config_service_1 = require("../../config/config.service");
const WHITE_LIST = config_service_1.env.WHITE_LIST.split(",");
exports.optionCors = {
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
        if (WHITE_LIST.includes(origin))
            return callback(null, true);
        return callback(new Error("Not Allowed By CORS"));
    },
};
