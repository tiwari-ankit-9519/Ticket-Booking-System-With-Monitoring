import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authRateLimit } from "../middlewares/rate-limit.middleware";

const router: Router = Router();

router.post("/register", authRateLimit, authController.register);

router.post("/login", authRateLimit, authController.login);

router.post("/refresh", authController.refreshToken);

router.post("/logout", authenticate, authController.logout);

router.get("/me", authenticate, authController.getCurrentUser);

router.post("/change-password", authenticate, authController.changePassword);

router.post(
  "/send-verification",
  authenticate,
  authController.sendVerificationEmail,
);

router.post("/verify-email", authController.verifyEmail);

router.post(
  "/forgot-password",
  authRateLimit,
  authController.requestPasswordReset,
);

router.post("/reset-password", authController.resetPassword);

export default router;
