import express from "express";
import { loginUser, registerUser, updateContactsList, verifyUserForPasswordReset, resetPassword, getUserProfile, updateUserProfile, updateProfileImage, updateUserPassword } from "../Controllers/userController.js";
import { verifyToken } from "../Middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/verify-reset", verifyUserForPasswordReset);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/user/profile", verifyToken, getUserProfile);
router.put("/user/profile", verifyToken, updateUserProfile);
router.put("/user/profile/image", verifyToken, updateProfileImage);
router.put("/user/password", verifyToken, updateUserPassword);
router.post("/updateContactList", verifyToken, updateContactsList);

export default router;
