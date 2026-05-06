import { config } from "dotenv";

config();

export const settings = {
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};
