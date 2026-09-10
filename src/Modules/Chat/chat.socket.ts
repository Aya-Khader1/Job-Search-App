import { Server } from "socket.io";
import { AuthedSocket } from "../../Utils/socket/socket.service";
import { findById } from "../../DB/db.repository";
import { CompanyModel } from "../../DB/Models/company.model";
import { ChatModel } from "../../DB/Models/chat.model";
import { UserModel } from "../../DB/Models/user.model";
import { ROLE } from "../../Utils/enums/user.enum";

export const registerChatEvents = (io: Server, socket: AuthedSocket) => {
  const currentUser = socket.user!;

  socket.on("startConversation", async ({ receiverId, companyId, message }) => {
    try {
      const company = await findById({ model: CompanyModel, id: companyId });
      if (!company) {
        socket.emit("error", { message: "Company not found" });
        return;
      }

      const isOwner =
        company.createdBy.toString() === currentUser._id.toString();
      const isHR = company.HRs?.some(
        (hrId) => hrId.toString() === currentUser._id.toString(),
      );

      if (!isOwner && !isHR) {
        socket.emit("error", {
          message: "Only company owner or HR can start a conversation",
        });
        return;
      }
      const receiver = await findById({ model: UserModel, id: receiverId });
      if (!receiver) {
        socket.emit("error", { message: "Receiver not found" });
        return;
      }
      if (receiver.role !== ROLE.USER) {
        socket.emit("error", {
          message: "You can only start a conversation with a regular user",
        });
        return;
      }

      let chat = await ChatModel.findOne({
        senderId: currentUser._id,
        receiverId,
      });
      if (!chat) {
        chat = await ChatModel.create({
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
    } catch (error) {
      socket.emit("error", { message: "Failed to start conversation" });
    }
  });

  socket.on("sendMessage", async ({ chatId, message }) => {
    try {
      const chat = await findById({ model: ChatModel, id: chatId });
      if (!chat) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const isParticipant =
        chat.senderId.toString() === currentUser._id.toString() ||
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

      const recipientId =
        chat.senderId.toString() === currentUser._id.toString()
          ? chat.receiverId.toString()
          : chat.senderId.toString();

      io.to(recipientId).emit("newMessage", payload);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};
