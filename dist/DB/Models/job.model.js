"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = exports.SeniorityLevel = exports.WorkingTime = exports.JobLocation = void 0;
const mongoose_1 = require("mongoose");
var JobLocation;
(function (JobLocation) {
    JobLocation["onsite"] = "onsite";
    JobLocation["remotely"] = "remotely";
    JobLocation["hybrid"] = "hybrid";
})(JobLocation || (exports.JobLocation = JobLocation = {}));
var WorkingTime;
(function (WorkingTime) {
    WorkingTime["partTime"] = "part-time";
    WorkingTime["fullTime"] = "full-time";
})(WorkingTime || (exports.WorkingTime = WorkingTime = {}));
var SeniorityLevel;
(function (SeniorityLevel) {
    SeniorityLevel["fresh"] = "fresh";
    SeniorityLevel["junior"] = "junior";
    SeniorityLevel["midLevel"] = "mid-level";
    SeniorityLevel["senior"] = "senior";
    SeniorityLevel["teamLead"] = "team-lead";
    SeniorityLevel["cto"] = "cto";
})(SeniorityLevel || (exports.SeniorityLevel = SeniorityLevel = {}));
const jobSchema = new mongoose_1.Schema({
    jobTitle: {
        type: String,
        required: true,
        min: 3,
        max: 64,
        trim: true,
    },
    jobLocation: {
        type: String,
        enum: Object.values(JobLocation),
        required: true,
    },
    workingTime: {
        type: String,
        enum: Object.values(WorkingTime),
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
        trim: true,
    },
    seniorityLevel: {
        type: String,
        enum: Object.values(SeniorityLevel),
        required: true,
    },
    technicalSkills: {
        type: [String],
        default: [],
    },
    softSkills: {
        type: [String],
        default: [],
    },
    addedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    closed: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
jobSchema.virtual("applications", {
    ref: "application",
    localField: "_id",
    foreignField: "applicationId",
});
exports.JobModel = (0, mongoose_1.model)("Job", jobSchema);
