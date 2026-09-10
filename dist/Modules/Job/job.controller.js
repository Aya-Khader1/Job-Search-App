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
const job_service_1 = __importDefault(require("./job.service"));
const validators = __importStar(require("./job.validation"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const authentication_middleware_1 = require("../../Middlewares/authentication.middleware");
const token_1 = require("../../Utils/security/token");
const isCompanyAuthorized_1 = require("../../Middlewares/isCompanyAuthorized");
const user_enum_1 = require("../../Utils/enums/user.enum");
const cloudinary_1 = require("../../Utils/upload/cloudinary");
const router = (0, express_1.Router)({ mergeParams: true });
router.use((0, authentication_middleware_1.authentication)({ tokenType: token_1.TokenTypeEnum.ACCESS }));
router.post("/add-job", (0, validation_middleware_1.validation)(validators.addJobSchema), (0, isCompanyAuthorized_1.isCompanyAuthorized)({ owner: true, hr: true }), job_service_1.default.addJob);
router.patch("/update-job/:jobId", (0, isCompanyAuthorized_1.isCompanyAuthorized)({ owner: true }), job_service_1.default.updateJob);
router.delete("/delete-job/:jobId", (0, isCompanyAuthorized_1.isCompanyAuthorized)({ owner: true, hr: true }), job_service_1.default.deleteJob);
router.get("/get{/:jobId}", job_service_1.default.getJobs);
router.get("/get-match", (0, validation_middleware_1.validation)(validators.getMatchedJobQuery), job_service_1.default.getMatchedJobs);
router.post("/apply-job/:jobId", (0, authentication_middleware_1.authorization)({ accessRoles: [user_enum_1.ROLE.USER] }), (0, cloudinary_1.fileUpload)().single("cv"), (0, cloudinary_1.fileTypeValidation)(cloudinary_1.fileValidation.documents), job_service_1.default.applyJob);
router.get("/get-applications/:jobId", (0, isCompanyAuthorized_1.isCompanyAuthorized)({ owner: true, hr: true }), job_service_1.default.getAllApplication);
router.patch("/status-application/:applicationId", (0, validation_middleware_1.validation)(validators.updateApplicationStatusSchema), (0, isCompanyAuthorized_1.isCompanyAuthorized)({ owner: true, hr: true }), job_service_1.default.updateApplicationStatus);
exports.default = router;
