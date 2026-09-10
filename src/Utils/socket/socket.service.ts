import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { HUserDocument } from "../../DB/Models/user.model";
import { decodedToken } from "../security/token";
import { registerChatEvents } from "../../Modules/Chat/chat.socket";
let io: Server | null = null;
export const getIo = (): Server | null => io;
export interface AuthedSocket extends Socket {
  user?: HUserDocument;
}
export const intializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const authorization = socket.handshake.auth?.token as string | undefined;
      const { user } = await decodedToken({ authorization });
      socket.user = user;
      next();
    } catch (error) {
      next(new Error((error as Error).message) || "Unauthorized Socket");
    }
  });
  io.on("connection", (socket: AuthedSocket) => {
    const user = socket.user;
    const userId = user?._id.toString() as string;
    console.log(`Socket connected:${user?.firstName} (${socket.id})`);
    socket.join(userId);
    registerChatEvents(io!, socket);
    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.user?.firstName} (${socket.id})`,
      );
    });
  });
  console.log("[Socket] Socket.IO Server is ready");
  return io;
};
