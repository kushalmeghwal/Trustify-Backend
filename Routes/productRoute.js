const express = require("express");
const router = express.Router();
const { getProduct, addProductCar } = require("../Controllers/productController");

router.get("/getProducts", getProduct);
router.post("/addProduct", addProductCar);

module.exports = router;
