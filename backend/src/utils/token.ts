import jwt from "jsonwebtoken";
import crypto from "crypto";
import { TTokenPayload } from "../lib/types/types";

export const createAccessToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

export const verifyRefreshToken = (token: string): TTokenPayload => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string,
  ) as TTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
