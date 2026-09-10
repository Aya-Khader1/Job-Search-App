"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const config_service_1 = require("../../config/config.service");
const sendEmail = async (data) => {
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        auth: {
            user: config_service_1.env.EMAIL_USERNAME,
            pass: config_service_1.env.EMAIL_PASSWORD,
        },
    });
    await transporter.sendMail({
        ...data,
        from: `"Job Search Application"<${config_service_1.env.EMAIL_USERNAME}>`,
    });
};
exports.sendEmail = sendEmail;
