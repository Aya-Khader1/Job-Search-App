"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../config/config.service");
const generateHash = async (payload, saltRound = Number(config_service_1.env.SALT_ROUNDS)) => {
    return await (0, bcrypt_1.hash)(payload, saltRound);
};
exports.generateHash = generateHash;
const compareHash = async (plaintext, hashValue) => {
    return await (0, bcrypt_1.compare)(plaintext, hashValue);
};
exports.compareHash = compareHash;
