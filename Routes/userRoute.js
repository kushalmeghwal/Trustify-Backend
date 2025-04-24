import { Router } from "express";
const router = Router();

<<<<<<< HEAD
router.post("/login", getUsers);
router.post("/register", registerUsers);
router.post("/updateContactList", updateContactsList);
=======
import { loginUser, registerUser, updateContactsList } from '../Controllers/userController.js';
import { isAuthenticated } from "../Middlewares/auth.js";
>>>>>>> 6f4fe0e8f8850eb8e26e2ae88b2b040805550950

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/updateContactList",updateContactsList);

export default router;
