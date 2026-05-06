import { TTokenPayload } from "../../lib/types/types";

export const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

type TUserForTokenPayload = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const buildTokenPayload = (
  user: TUserForTokenPayload,
): TTokenPayload => {
  return {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
};

export const getRefreshTokenExpiresAt = (): Date => {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
};

export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && !!value.trim();
};

export const normalizeString = (value: string): string => {
  return value.trim();
};
