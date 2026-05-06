import { Request } from "express";

//loginController

export type TLoginBody = {
  email?: string;
  password?: string;
};

//AuthMiddleware
export type TJwtPayload = {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
};

export type TAuthRequest = Request & {
  user?: TJwtPayload;
};

//registerController
export type TRegisterBody = {
  email?: string;
  username?: string;
  password?: string;
};

export type TMakeAdminBody = {
  email?: string;
};

//tokens

export type TTokenPayload = {
  sub: string;
  email: string;
  username: string;
  role: string;
};
