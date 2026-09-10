"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationModel = exports.ApplicationStatus = void 0;
const mongoose_1 = require("mongoose");
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["pending"] = "pending";
    ApplicationStatus["accepted"] = "accepted";
    ApplicationStatus["rejected"] = "rejected";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
const applicationSchema = new mongoose_1.Schema({
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userCV: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
    },
    status: {
        type: String,
        enum: Object.values(ApplicationStatus),
        default: ApplicationStatus.pending,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.ApplicationModel = (0, mongoose_1.model)("Application", applicationSchema);
