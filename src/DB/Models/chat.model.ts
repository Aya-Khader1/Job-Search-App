import { HydratedDocument, Model, Schema, Types, model } from "mongoose";
export interface IMessage {
  message: string;
  senderId: Types.ObjectId;
  sentAt: Date;
}
export interface IChat {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  messages: IMessage[];

  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChat>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
chatSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
export const ChatModel: Model<IChat> = model<IChat>("chat", chatSchema);

export type HChatDocument = HydratedDocument<IChat>;
