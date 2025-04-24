import express from "express";
import { loginUsers, registerUsers, updateContactsList } from "../Controllers/userController.js";

const router = express.Router();

router.post("/login", loginUsers);
router.post("/register", registerUsers);
router.post("/updateContactList", updateContactsList);

export default router;
