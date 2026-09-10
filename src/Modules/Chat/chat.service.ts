import { Response, Request } from "express";
import { findOne } from "../../DB/db.repository";
import { ChatModel } from "../../DB/Models/chat.model";
class chatService {
  getChatHistory = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const chat = await findOne({
      model: ChatModel,
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

export default new chatService();
