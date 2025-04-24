import { Router } from "express";
const router = Router();
import { getProduct, addProductCar, verifyProduct } from "../Controllers/productController.js";
import { isAuthenticated } from "../Middlewares/auth.js";

router.get("/getProducts", getProduct);
router.post("/addProduct", addProductCar);
router.post("/product/:p_id/verify",verifyProduct);//not sure about route

export default router;
