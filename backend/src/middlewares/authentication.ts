import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "../lib/createError";
import { settings } from "../config/settings";
import { TJwtPayload, TAuthRequest } from "../lib/types/types";

export const authenticateMiddleware = (
  req: TAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createError(401, "authorization header missing"));
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return next(createError(401, "invalid authorization format"));
  }

  if (!settings.JWT_SECRET) {
    return next(createError(500, "missing JWT secret"));
  }

  try {
    const decoded = jwt.verify(token, settings.JWT_SECRET) as TJwtPayload;

    req.user = decoded;

    return next();
  } catch (error) {
    return next(createError(401, "invalid or expired token"));
  }
};
