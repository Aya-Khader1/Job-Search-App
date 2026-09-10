"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_service_1 = __importDefault(require("./company.service"));
const validators = __importStar(require("./company.validation"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const token_1 = require("../../Utils/security/token");
const user_enum_1 = require("../../Utils/enums/user.enum");
const cloudinary_1 = require("../../Utils/upload/cloudinary");
const isCompanyOwner_middleware_1 = require("../../Middlewares/isCompanyOwner.middleware");
const Job_1 = require("../Job");
const router = (0, express_1.Router)();
router.use("/:companyId/jobs", Job_1.jobController);
router.use((0, authentication_middleware_1.authentication)({ tokenType: token_1.TokenTypeEnum.ACCESS }));
router.post("/add-company", (0, validation_middleware_1.validation)(validators.addCompanySchema), company_service_1.default.addCompany);
router.patch("/update-company/:companyId", (0, validation_middleware_1.validation)(validators.updateCompanySchema), company_service_1.default.updateCompany);
router.get("/search", company_service_1.default.searchCompany);
router.get("/get-company/:companyId", (0, validation_middleware_1.validation)(validators.IdParamsCompanySchema), company_service_1.default.getSpecificCompany);
router.patch("/delete-company/:companyId", (0, authentication_middleware_1.authorization)({ accessRoles: [user_enum_1.ROLE.ADMIN, user_enum_1.ROLE.USER] }), (0, validation_middleware_1.validation)(validators.IdParamsCompanySchema), company_service_1.default.deleteCompany);
router.patch("/upload-logo/:companyId", (0, cloudinary_1.fileUpload)().single("image"), (0, cloudinary_1.fileTypeValidation)(cloudinary_1.fileValidation.images), isCompanyOwner_middleware_1.isCompanyOwner, company_service_1.default.uploadLogo);
router.delete("/delete-logo/:companyId", isCompanyOwner_middleware_1.isCompanyOwner, company_service_1.default.deleteLogo);
router.post("/upload-cover-pics/:companyId", (0, cloudinary_1.fileUpload)().array("images", 5), (0, cloudinary_1.fileTypeValidation)(cloudinary_1.fileValidation.images), isCompanyOwner_middleware_1.isCompanyOwner, company_service_1.default.uploadCoverPic);
router.delete("/delete-cover-pic/:companyId", isCompanyOwner_middleware_1.isCompanyOwner, company_service_1.default.deleteCoverPic);
exports.default = router;
