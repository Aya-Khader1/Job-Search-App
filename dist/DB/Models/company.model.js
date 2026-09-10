"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModel = exports.companySchema = exports.employeeRanges = void 0;
const mongoose_1 = require("mongoose");
exports.employeeRanges = [
    "1-10",
    "11-20",
    "21-50",
    "51-100",
    "101-500",
    "500+",
];
exports.companySchema = new mongoose_1.Schema({
    companyName: {
        type: String,
        required: true,
        unique: true,
        minLength: 2,
        maxlength: 25,
    },
    description: {
        type: String,
        required: true,
        minLength: 2,
        maxlength: 100,
    },
    industry: {
        type: String,
        required: true,
        minLength: 2,
        maxlength: 40,
    },
    address: {
        type: String,
        required: true,
    },
    numberOfEmployees: {
        type: String,
        enum: exports.employeeRanges,
        required: true,
    },
    companyEmail: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    HRs: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    logo: {
        type: {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true },
        },
    },
    coverPic: {
        type: [
            {
                secure_url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        default: [],
    },
    legalAttachment: {
        type: {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true },
        },
    },
    approvedByAdmin: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
    bannedAt: Date,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.companySchema.pre(["find", "findOne"], function (next) {
    this.where({ deletedAt: { $exists: false } });
    next();
});
exports.companySchema.virtual("jobs", {
    ref: "Job",
    localField: "_id",
    foreignField: "companyId",
});
exports.companySchema.index({ companyName: 1 });
exports.CompanyModel = (0, mongoose_1.model)("Company", exports.companySchema);
