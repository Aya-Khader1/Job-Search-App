import { createTransport, Mail } from "nodemailer";
import { env } from "../../config/config.service";

export const sendEmail = async (data: Mail.Options): Promise<void> => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USERNAME,
      pass: env.EMAIL_PASSWORD,
    },
  });
  await transporter.sendMail({
    ...data,
    from: `"Job Search Application"<${env.EMAIL_USERNAME}>`,
  });
};
