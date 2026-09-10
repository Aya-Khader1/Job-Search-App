"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootsrap = void 0;
const express_1 = __importDefault(require("express"));
const config_service_1 = require("./config/config.service");
const connection_1 = require("./DB/connection");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("./Modules/index");
const error_response_1 = require("./Utils/response/error.response");
const Company_1 = require("./Modules/Company");
const Admin_1 = require("./Modules/Admin");
const Job_1 = require("./Modules/Job");
const express_2 = require("graphql-http/lib/use/express");
const admin_schema_1 = require("./Modules/Admin/graphql/admin.schema");
const admin_context_1 = require("./Modules/Admin/graphql/admin.context");
const socket_service_1 = require("./Utils/socket/socket.service");
const deleteExpiredOtp_cron_1 = require("./Utils/corn/deleteExpiredOtp.cron");
const bootsrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    await (0, connection_1.connectDB)();
    app.all("/graphql", (0, express_2.createHandler)({
        schema: admin_schema_1.schema,
        context: async (req) => {
            const raw = req.raw;
            const context = await (0, admin_context_1.buildContext)(raw.headers.authorization);
            return context;
        },
    }));
    app.use((0, helmet_1.default)(), (0, cors_1.default)({
        origin: "*",
    }));
    app.use("/api/v1/auth", index_1.AuthController);
    app.use("/api/v1/user", index_1.UserController);
    app.use("/admin", Admin_1.AdminController);
    app.use("/api/v1/company", Company_1.CompanyController);
    app.use("/api/v1/job", Job_1.jobController);
    app.use("/api/v1/chat", index_1.chatController);
    app.get("/", (req, res) => {
        console.log("Application is running");
    });
    app.use(error_response_1.globalHandeler);
    (0, deleteExpiredOtp_cron_1.startExpiredOtpCleanupJob)();
    const httpServer = app.listen(config_service_1.env.PORT, () => {
        console.log(`Server is running on http://localhost:${config_service_1.env.PORT}`);
    });
    (0, socket_service_1.intializeSocket)(httpServer);
};
exports.bootsrap = bootsrap;
