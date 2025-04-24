import { Router } from "express";
const router = Router();

import { loginUser, registerUser, updateContactsList } from '../Controllers/userController.js';
import { isAuthenticated } from "../Middlewares/auth.js";

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/updateContactList",updateContactsList);

export default router;
