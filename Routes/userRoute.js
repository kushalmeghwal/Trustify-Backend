import express from "express";
import { loginUser, registerUser, updateContactsList } from "../Controllers/userController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/updateContactList", updateContactsList);

export default router;
