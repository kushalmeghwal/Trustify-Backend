import express from "express";
import { getProduct, addProduct, getUserProducts } from "../Controllers/productController.js";
import { verifyToken } from "../Middlewares/auth.js";

const router = express.Router();

router.get("/getProducts", getProduct);
router.post("/addProduct", addProduct);
router.get("/user/:userId", verifyToken, getUserProducts);

export default router;
