import express from "express";
import { signup, login, logout, logoutAll, refreshToken, forgotPassword, resetPassword, changePassword, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { signupValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/logout", protectRoute, logout);
router.post("/logout-all", protectRoute, logoutAll);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.post("/reset-password", resetPasswordValidator, resetPassword);
router.put("/change-password", protectRoute, changePasswordValidator, changePassword);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
