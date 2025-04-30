import express from "express";
import { getProduct,getProductById, addProduct ,verifyProduct,getMyProducts} from "../Controllers/productController.js";

const router = express.Router();

router.get("/getProducts", getProduct);
router.get("/getProductById",getProductById);
router.post("/addProduct", addProduct);
router.get("/verifyProduct",verifyProduct);
router.get("/myProducts",getMyProducts);



export default router;
