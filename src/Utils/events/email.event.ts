import EventEmitter from "node:events";
import { Mail } from "nodemailer";
import { sendEmail } from "../email/send.email";
import { generateEmailTemplate } from "../email/email.template";

export const emailEvents = new EventEmitter();
interface IEmail extends Mail.Options {
  otp: string;
  username: string;
}
emailEvents.on("confirmEmail", async (data: IEmail) => {
  try {
    data.html = generateEmailTemplate({
      title: "Verify your identity",
      greeting: `Hi ${data.username},`,
      message: " Enter the code below to confirm your email address.",
      otpCode: data.otp,
      footerNote: "Didn't create an account? You can safely ignore this email.",
    });
    data.subject = "Confirm Your Email";
    await sendEmail(data);
  } catch (error) {
    console.log("Faild to send email", error);
  }
});
emailEvents.on("forgetPassword", async (data: IEmail) => {
  try {
    data.html = generateEmailTemplate({
      title: "Reset Your Password",
      greeting: `Hi ${data.username},`,
      message: "Use the code below to reset your password.",
      otpCode: data.otp,
      footerNote:
        "If you didn't request a password reset, you can safely ignore this email.",
    });
    data.subject = "Reset Your Password";
    await sendEmail(data);
  } catch (error) {
    console.log("Faild to send email", error);
  }
});
emailEvents.on("acceptedJob", async (data: IEmail) => {
  try {
    data.html = generateEmailTemplate({
      title: "Job Application Accepted",
      greeting: `Hi ${data.username},`,
      message:
        "Congratulations! Your application has been accepted. We are pleased to let you know that your application has successfully passed the selection process.",
      footerNote:
        "Please contact the company if you need any additional information.",
    });
    data.subject = "Your Job Application Has Been Accepted";
    await sendEmail(data);
  } catch (error) {
    console.log("Faild to send email", error);
  }
});
emailEvents.on("rejectedJob", async (data: IEmail) => {
  try {
    data.html = generateEmailTemplate({
      title: "Reset Your Password",
      greeting: `Hi ${data.username},`,
      message:
        "Thank you for your interest and for taking the time to apply. Unfortunately, your application was not selected for this position. We appreciate your effort and wish you the best in your future opportunities.",
      footerNote:
        "Thank you for considering our company, and we encourage you to apply for future opportunities.",
    });
    data.subject = "Update Regarding Your Job Application";
    await sendEmail(data);
  } catch (error) {
    console.log("Faild to send email", error);
  }
});
