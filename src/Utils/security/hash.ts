import bcrypt, { compare, hash } from "bcrypt";
import { env } from "../../config/config.service";
export const generateHash = async (
  payload: string,
  saltRound: number = Number(env.SALT_ROUNDS),
): Promise<string> => {
  return await hash(payload, saltRound);
};

export const compareHash = async (
  plaintext: string,
  hashValue: string,
): Promise<boolean> => {
  return await compare(plaintext, hashValue);
};
