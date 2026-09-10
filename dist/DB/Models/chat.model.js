"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    messages: [
        {
            message: {
                type: String,
                required: true,
                trim: true,
            },
            senderId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            sentAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
chatSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
exports.ChatModel = (0, mongoose_1.model)("chat", chatSchema);
