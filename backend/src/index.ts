import express, { json, NextFunction, Request, Response } from "express";
import cors from "cors";
import { settings } from "./config/settings";
import { createAnswer } from "./lib/createAnswer";
import { createError, TCreateError } from "./lib/createError";
import { authRouter } from "./features/auth/authRoutes";

const app = express();
app.use(json());
const BASE_URL = settings.BASE_URL;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(`/${BASE_URL}`, authRouter);

app.use((req, res, next) => {
  next(createError(404, "Not here, not found"));
});

app.use(
  (err: TCreateError, req: Request, res: Response, next: NextFunction) => {
    res
      .status(err.status || 500)
      .json(createAnswer(err.status || 500, err.message || "Server Error", []));
  },
);

app.listen(settings.PORT, () => {
  console.log(`Server boot success! Port: ${settings.PORT}`);
});
