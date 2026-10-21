import { CorsOptions } from "cors";
import { env } from "../../config/config.service";

export const WHITE_LIST: string[] = (env.WHITE_LIST ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const optionCors: CorsOptions = {
  origin(origin, callback) {
    if (!origin || WHITE_LIST.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
};
