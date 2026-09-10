"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_service_1 = __importDefault(require("./admin.service"));
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const user_enum_1 = require("../../Utils/enums/user.enum");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const admin_validation_1 = require("./admin.validation");
const token_1 = require("../../Utils/security/token");
const router = (0, express_1.Router)();
router.use((0, authentication_middleware_1.authentication)({ tokenType: token_1.TokenTypeEnum.ACCESS }));
router.use((0, authentication_middleware_1.authorization)({ accessRoles: [user_enum_1.ROLE.ADMIN] }));
router.patch("/users/banUnbanUser/:userId", admin_service_1.default.banUnbanUser);
router.patch("/companies/banUnbanCompany/:companyId", (0, validation_middleware_1.validation)(admin_validation_1.IdComapyParams), admin_service_1.default.banUnbanCompany);
router.patch("/companies/approve-company/:companyId", (0, validation_middleware_1.validation)(admin_validation_1.IdComapyParams), admin_service_1.default.approvedCompany);
exports.default = router;
