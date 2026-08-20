import { signup, login, googleLogin, refresh, logout, getProfile, updateProfile, changePassword } from "../controllers/authController.js";
import express from "express";
import { authRateLimit } from "../middleware/securityMiddleware.js";
import protect from "../middleware/authMiddleware.js";

const router =  express.Router()

router.use(authRateLimit);
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.patch("/profile/password", protect, changePassword);

export default router;
