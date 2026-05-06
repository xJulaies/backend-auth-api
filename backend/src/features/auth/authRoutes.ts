import { Router } from "express";
import {
  POST_registerController,
  POST_loginController,
  GET_meController,
  GET_adminController,
  PATCH_makeAdminController,
  POST_refreshController,
  POST_logoutController,
} from "./authController";
import { authenticateMiddleware } from "../../middlewares/authentication";
import { authorizeMiddleware } from "../../middlewares/authorization";

export const authRouter = Router();

//public
authRouter.post("/login", POST_loginController);
authRouter.post("/register", POST_registerController);
authRouter.post("/refresh", POST_refreshController);
authRouter.post("/logout", POST_logoutController);

//protected
authRouter.get("/me", authenticateMiddleware, GET_meController);
authRouter.get(
  "/admin",
  authenticateMiddleware,
  authorizeMiddleware,
  GET_adminController,
);

//special
authRouter.patch(
  "/make-admin",
  authenticateMiddleware,
  authorizeMiddleware,
  PATCH_makeAdminController,
);
