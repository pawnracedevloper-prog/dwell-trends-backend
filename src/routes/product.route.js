import express from "express";
import multer from "multer";
import { createProduct, getProducts, deleteProduct } from "../controllers/product.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer config for temporary local storage before Cloudinary upload
const storage = multer.diskStorage({});
const upload = multer({ storage });

router.get("/", getProducts);
router.post("/", protect, admin, upload.array("images", 5), createProduct);
router.delete("/:id", protect, admin, deleteProduct);

export default router;