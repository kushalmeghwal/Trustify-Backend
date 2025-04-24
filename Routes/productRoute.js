import { Router } from "express";
const router = Router();
import { getProduct, addProduct } from "../Controllers/productController.js";
import { isAuthenticated } from "../Middlewares/auth.js";

router.get("/getProducts", getProduct);
router.post("/addProduct", addProduct);

export default router;
