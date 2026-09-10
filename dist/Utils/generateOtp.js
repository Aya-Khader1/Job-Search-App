"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
const node_crypto_1 = require("node:crypto");
const generateOTP = () => {
    return String((0, node_crypto_1.randomInt)(100000, 1000000));
};
exports.generateOTP = generateOTP;
