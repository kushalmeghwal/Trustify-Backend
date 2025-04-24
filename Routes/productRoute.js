const express = require("express");
const router = express.Router();
const { getProduct, addProduct } = require("../Controllers/productController");

router.get("/getProducts", getProduct);
router.post("/addProduct", addProduct);

export default router;
