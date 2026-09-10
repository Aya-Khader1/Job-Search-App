"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatEvents = void 0;
const db_repository_1 = require("../../DB/db.repository");
const company_model_1 = require("../../DB/Models/company.model");
const chat_model_1 = require("../../DB/Models/chat.model");
const user_model_1 = require("../../DB/Models/user.model");
const user_enum_1 = require("../../Utils/enums/user.enum");
const registerChatEvents = (io, socket) => {
    const currentUser = socket.user;
    socket.on("startConversation", async ({ receiverId, companyId, message }) => {
        try {
            const company = await (0, db_repository_1.findById)({ model: company_model_1.CompanyModel, id: companyId });
            if (!company) {
                socket.emit("error", { message: "Company not found" });
                return;
            }
            const isOwner = company.createdBy.toString() === currentUser._id.toString();
            const isHR = company.HRs?.some((hrId) => hrId.toString() === currentUser._id.toString());
            if (!isOwner && !isHR) {
                socket.emit("error", {
                    message: "Only company owner or HR can start a conversation",
                });
                return;
            }
            const receiver = await (0, db_repository_1.findById)({ model: user_model_1.UserModel, id: receiverId });
            if (!receiver) {
                socket.emit("error", { message: "Receiver not found" });
                return;
            }
            if (receiver.role !== user_enum_1.ROLE.USER) {
                socket.emit("error", {
                    message: "You can only start a conversation with a regular user",
                });
                return;
            }
            let chat = await chat_model_1.ChatModel.findOne({
                senderId: currentUser._id,
                receiverId,
            });
            if (!chat) {
                chat = await chat_model_1.ChatModel.create({
                    senderId: currentUser._id,
                    receiverId,
                    messages: [],
                });
            }
            chat.messages.push({
                message,
                senderId: currentUser._id,
                sentAt: new Date(),
            });
            await chat.save();
            const payload = {
                chatId: chat._id,
                senderId: currentUser._id,
                message,
                sentAt: new Date(),
            };
            socket.emit("messageSent", payload);
            io.to(receiverId.toString()).emit("newMessage", payload);
        }
        catch (error) {
            socket.emit("error", { message: "Failed to start conversation" });
        }
    });
    socket.on("sendMessage", async ({ chatId, message }) => {
        try {
            const chat = await (0, db_repository_1.findById)({ model: chat_model_1.ChatModel, id: chatId });
            if (!chat) {
                socket.emit("error", { message: "Conversation not found" });
                return;
            }
            const isParticipant = chat.senderId.toString() === currentUser._id.toString() ||
                chat.receiverId.toString() === currentUser._id.toString();
            if (!isParticipant) {
                socket.emit("error", {
                    message: "You are not part of this conversation",
                });
                return;
            }
            chat.messages.push({
                message,
                senderId: currentUser._id,
                sentAt: new Date(),
            });
            await chat.save();
            const payload = {
                chatId: chat._id,
                senderId: currentUser._id,
                message,
                sentAt: new Date(),
            };
            socket.emit("messageSent", payload);
            const recipientId = chat.senderId.toString() === currentUser._id.toString()
                ? chat.receiverId.toString()
                : chat.senderId.toString();
            io.to(recipientId).emit("newMessage", payload);
        }
        catch (error) {
            socket.emit("error", { message: "Failed to send message" });
        }
    });
};
exports.registerChatEvents = registerChatEvents;
