"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = void 0;
const token_1 = require("../../../Utils/security/token");
const buildContext = async (authorization) => {
    if (!authorization)
        return {};
    try {
        const { user } = await (0, token_1.decodedToken)({ authorization });
        return { user };
    }
    catch (error) {
        return {};
    }
};
exports.buildContext = buildContext;
