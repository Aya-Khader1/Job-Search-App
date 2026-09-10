"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvents = void 0;
const node_events_1 = __importDefault(require("node:events"));
const send_email_1 = require("../email/send.email");
const email_template_1 = require("../email/email.template");
exports.emailEvents = new node_events_1.default();
exports.emailEvents.on("confirmEmail", async (data) => {
    try {
        data.html = (0, email_template_1.generateEmailTemplate)({
            title: "Verify your identity",
            greeting: `Hi ${data.username},`,
            message: " Enter the code below to confirm your email address.",
            otpCode: data.otp,
            footerNote: "Didn't create an account? You can safely ignore this email.",
        });
        data.subject = "Confirm Your Email";
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Faild to send email", error);
    }
});
exports.emailEvents.on("forgetPassword", async (data) => {
    try {
        data.html = (0, email_template_1.generateEmailTemplate)({
            title: "Reset Your Password",
            greeting: `Hi ${data.username},`,
            message: "Use the code below to reset your password.",
            otpCode: data.otp,
            footerNote: "If you didn't request a password reset, you can safely ignore this email.",
        });
        data.subject = "Reset Your Password";
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Faild to send email", error);
    }
});
exports.emailEvents.on("acceptedJob", async (data) => {
    try {
        data.html = (0, email_template_1.generateEmailTemplate)({
            title: "Job Application Accepted",
            greeting: `Hi ${data.username},`,
            message: "Congratulations! Your application has been accepted. We are pleased to let you know that your application has successfully passed the selection process.",
            footerNote: "Please contact the company if you need any additional information.",
        });
        data.subject = "Your Job Application Has Been Accepted";
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Faild to send email", error);
    }
});
exports.emailEvents.on("rejectedJob", async (data) => {
    try {
        data.html = (0, email_template_1.generateEmailTemplate)({
            title: "Reset Your Password",
            greeting: `Hi ${data.username},`,
            message: "Thank you for your interest and for taking the time to apply. Unfortunately, your application was not selected for this position. We appreciate your effort and wish you the best in your future opportunities.",
            footerNote: "Thank you for considering our company, and we encourage you to apply for future opportunities.",
        });
        data.subject = "Update Regarding Your Job Application";
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Faild to send email", error);
    }
});
