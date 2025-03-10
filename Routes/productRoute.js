const express = require("express");
const router = express.Router();
const { getProduct, addProductCar } = require("../Controllers/productController");

router.get("/getProduct", getProduct);
router.post("/addProductCar", addProductCar);

module.exports = router;
