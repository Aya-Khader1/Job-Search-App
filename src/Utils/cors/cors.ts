import { CorsOptions } from "cors";
import { env } from "../../config/config.service";
const WHITE_LIST: Array<string> = env.WHITE_LIST.split(",");
export const optionCors: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (WHITE_LIST.includes(origin)) return callback(null, true);
    return callback(new Error("Not Allowed By CORS"));
  },
};
