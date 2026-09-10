"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_service_1 = __importDefault(require("./chat.service"));
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const token_1 = require("../../Utils/security/token");
const router = (0, express_1.Router)();
router.use((0, authentication_middleware_1.authentication)({ tokenType: token_1.TokenTypeEnum.ACCESS }));
router.get("/:userId", chat_service_1.default.getChatHistory);
exports.default = router;
