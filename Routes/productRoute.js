import { Router } from "express";
const router = Router();
import { getProduct, addProductCar } from "../Controllers/productController.js";
import { isAuthenticated } from "../Middlewares/auth.js";

router.get("/getProducts",isAuthenticated, getProduct);
router.post("/addProduct",isAuthenticated, addProductCar);

export default router;
