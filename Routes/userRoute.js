import { Router } from "express";
const router = Router();

import { loginUser, registerUser, updateContactsList } from '../Controllers/userController.js';
import { isAuthenticated } from "../Middlewares/auth.js";

router.post("/login", getUsers);
router.post("/register", registerUsers);
router.post("/updateContactList", updateContactsList);

export default router;
