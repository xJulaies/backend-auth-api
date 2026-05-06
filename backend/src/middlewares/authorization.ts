import { Response, NextFunction } from "express";
import type { TAuthRequest } from "../lib/types/types";
import { createError } from "../lib/createError";

export const authorizeMiddleware = (
  req: TAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(createError(401, "unauthorized"));
  }

  if (req.user.role !== "ADMIN") {
    return next(createError(403, "forbidden"));
  }

  return next();
};
