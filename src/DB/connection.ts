import mongoose from "mongoose";
import { env } from "../config/config.service";
export const connectDB = async () => {
  try {
    await mongoose.connect(env.DB_URI, {});
    console.log(`DB Connect Successfully`);
  } catch (error) {
    console.error(`Database connection failed`, error);
  }
};
