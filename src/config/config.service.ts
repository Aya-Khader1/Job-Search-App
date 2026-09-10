import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve("config/dev.env") });

export const env = {
  //APP
  PORT: process.env.PORT as string,
  ENV_MODE: process.env.MODE as string,
  DB_URI: process.env.DB_URI as string,
  SALT_ROUNDS: process.env.SALT_ROUNDS as string,
  ENCRYPTION_SECRET_KEY: process.env.ENCRYPTION_SECRET_KEY as string,
  WHITE_LIST: process.env.WHITE_LIST as string,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME as string,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD as string,
  ACCESS_USER_SIGNATURE: process.env.ACCESS_USER_SIGNATURE as string,
  REFRESH_USER_SIGNATURE: process.env.REFRESH_USER_SIGNATURE as string,
  ACCESS_ADMIN_SIGNATURE: process.env.ACCESS_ADMIN_SIGNATURE as string,
  REFRESH_ADMIN_SIGNATURE: process.env.REFRESH_ADMIN_SIGNATURE as string,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  CLIENT_ID: process.env.CLIENT_ID as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
};
