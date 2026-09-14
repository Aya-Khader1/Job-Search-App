import express, { Express, Request, Response } from "express";
import { env } from "./config/config.service";
import { connectDB } from "./DB/connection";
import helmet from "helmet";
import cors from "cors";
import { optionCors } from "./Utils/cors/cors";
import {
  AuthController,
  chatController,
  UserController,
} from "./Modules/index";
import { globalHandeler } from "./Utils/response/error.response";
import { customRateLimiter } from "./Middlewares/rate-limit.middleware";
import { CompanyController } from "./Modules/Company";
import { AdminController } from "./Modules/Admin";
import { jobController } from "./Modules/Job";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "./Modules/Admin/graphql/admin.schema";
import { buildContext } from "./Modules/Admin/graphql/admin.context";
import { intializeSocket } from "./Utils/socket/socket.service";
import { startExpiredOtpCleanupJob } from "./Utils/corn/deleteExpiredOtp.cron";
export const bootsrap = async (): Promise<void> => {
  const app: Express = express();
  app.use(express.json());
  await connectDB();
  app.use(
    helmet(),
    cors({
      origin: "*",
    }),
    customRateLimiter(),
  );
  app.all(
    "/graphql",
    createHandler({
      schema,
      context: async (req) => {
        const raw = req.raw as Request;
        const context = await buildContext(raw.headers.authorization);
        return context;
      },
    }),
  );
  app.get("/api/v1/test", (req, res) => {
    res.json({
      message: "API works",
    });
  });
  app.use("/api/v1/auth", AuthController);
  app.use("/api/v1/user", UserController);
  app.use("/admin", AdminController);

  app.use("/api/v1/company", CompanyController);
  app.use("/api/v1/job", jobController);
  app.use("/api/v1/chat", chatController);
  app.get("/", (req, res) => {
    res.send("Hello");
  });
  app.use(globalHandeler);
  startExpiredOtpCleanupJob();
  app.listen(Number(env.PORT), () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
  //  intializeSocket(httpServer);
};
