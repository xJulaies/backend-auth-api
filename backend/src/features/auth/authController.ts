import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../db";
import { createAnswer } from "../../lib/createAnswer";
import { createError } from "../../lib/createError";
import {
  TAuthRequest,
  TRegisterBody,
  TMakeAdminBody,
} from "../../lib/types/types";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../../utils/token";
import {
  normalizeEmail,
  buildTokenPayload,
  getRefreshTokenExpiresAt,
  isNonEmptyString,
  normalizeString,
} from "./auth.helpers";

export const POST_loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res
        .status(400)
        .json(createAnswer(400, "email and password are required", []));
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizeString(password);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json(createAnswer(401, "invalid credentials", []));
    }

    const isPasswordCorrect = await bcrypt.compare(
      normalizedPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json(createAnswer(401, "invalid credentials", []));
    }

    const payload = buildTokenPayload(user);

    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        hashedToken: hashToken(refreshToken),
        userId: user.id,
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });

    return res.status(200).json(
      createAnswer(200, "login successful", [
        {
          accessToken,
          refreshToken,
        },
      ]),
    );
  } catch (error) {
    console.error("POST_loginController error:", error);
    return res.status(500).json(createAnswer(500, "internal server error", []));
  }
};

export const GET_meController = (
  req: TAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(createError(401, "unauthorized"));
  }

  return res.status(200).json(createAnswer(200, "authorized", [req.user]));
};

export const GET_adminController = (req: TAuthRequest, res: Response) => {
  return res
    .status(200)
    .json(createAnswer(200, "admin access granted", [req.user]));
};

export const POST_registerController = async (
  req: Request<{}, {}, TRegisterBody>,
  res: Response,
  next: NextFunction,
) => {
  const { email, username, password } = req.body;

  if (
    !isNonEmptyString(email) ||
    !isNonEmptyString(username) ||
    !isNonEmptyString(password)
  ) {
    return next(createError(400, "email, username and password are required"));
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeString(username);
  const normalizedPassword = normalizeString(password);

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existingUser) {
      return next(createError(400, "email or username already exists"));
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(201)
      .json(createAnswer(201, "user created successfully", [user]));
  } catch (error) {
    return next(createError(500, "registration failed"));
  }
};

export const PATCH_makeAdminController = async (
  req: Request<{}, {}, TMakeAdminBody>,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;

  if (!isNonEmptyString(email)) {
    return next(createError(400, "email is required"));
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existingUser) {
      return next(createError(404, "user not found"));
    }

    const updatedUser = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .json(createAnswer(200, "user promoted to admin", [updatedUser]));
  } catch (error) {
    return next(createError(500, "could not update user role"));
  }
};

export const POST_refreshController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!isNonEmptyString(refreshToken)) {
      return res
        .status(400)
        .json(createAnswer(400, "refresh token is required", []));
    }

    const normalizedRefreshToken = normalizeString(refreshToken);
    const decoded = verifyRefreshToken(normalizedRefreshToken);
    const hashedRefreshToken = hashToken(normalizedRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        hashedToken: hashedRefreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      return res
        .status(401)
        .json(createAnswer(401, "invalid refresh token", []));
    }

    if (storedToken.revoked) {
      return res
        .status(401)
        .json(createAnswer(401, "refresh token revoked", []));
    }

    if (storedToken.expiresAt < new Date()) {
      return res
        .status(401)
        .json(createAnswer(401, "refresh token expired", []));
    }

    if (decoded.sub !== storedToken.userId) {
      return res
        .status(401)
        .json(createAnswer(401, "invalid refresh token", []));
    }

    const payload = buildTokenPayload(storedToken.user);

    const newAccessToken = createAccessToken(payload);
    const newRefreshToken = createRefreshToken(payload);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: {
          hashedToken: hashedRefreshToken,
        },
        data: {
          revoked: true,
        },
      }),
      prisma.refreshToken.create({
        data: {
          hashedToken: hashToken(newRefreshToken),
          userId: storedToken.user.id,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      }),
    ]);

    return res.status(200).json(
      createAnswer(200, "token refreshed", [
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      ]),
    );
  } catch (error) {
    return res
      .status(401)
      .json(createAnswer(401, "invalid or expired refresh token", []));
  }
};

export const POST_logoutController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!isNonEmptyString(refreshToken)) {
      return res
        .status(400)
        .json(createAnswer(400, "refresh token is required", []));
    }

    const normalizedRefreshToken = refreshToken.trim();
    const hashedRefreshToken = hashToken(normalizedRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        hashedToken: hashedRefreshToken,
      },
    });

    if (!storedToken) {
      return res
        .status(401)
        .json(createAnswer(401, "invalid refresh token", []));
    }

    if (storedToken.revoked) {
      return res.status(200).json(createAnswer(200, "logout successful", []));
    }

    await prisma.refreshToken.update({
      where: {
        hashedToken: hashedRefreshToken,
      },
      data: {
        revoked: true,
      },
    });

    return res.status(200).json(createAnswer(200, "logout successful", []));
  } catch (error) {
    return res.status(500).json(createAnswer(500, "internal server error", []));
  }
};
