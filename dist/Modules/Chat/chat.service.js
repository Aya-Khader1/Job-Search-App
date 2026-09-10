"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_repository_1 = require("../../DB/db.repository");
const chat_model_1 = require("../../DB/Models/chat.model");
class chatService {
    getChatHistory = async (req, res) => {
        const { userId } = req.params;
        const chat = await (0, db_repository_1.findOne)({
            model: chat_model_1.ChatModel,
            filter: {
                $or: [
                    { senderId: userId, receiverId: req.user._id },
                    { senderId: req.user._id, receiverId: userId },
                ],
            },
            options: {
                populate: {
                    path: "messages.senderId",
                    select: "firstName lastName profilePic",
                },
            },
        });
        if (!chat) {
            return res.status(200).json({
                message: "No conversation found yet",
                data: { messages: [] },
            });
        }
        return res.status(200).json({
            message: "Chat history fetched successfully",
            data: { chat },
        });
    };
}
exports.default = new chatService();
