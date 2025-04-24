import express from "express";
import { getProduct, addProduct } from "../Controllers/productController.js";

const router = express.Router();

router.get("/getProducts", getProduct);
router.post("/addProduct", addProduct);

export default router;
