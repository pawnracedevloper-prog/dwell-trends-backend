import express from "express";
import { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  getAllOrders, 
  updateOrderStatus 
} from "../controllers/order.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", optionalAuth, createOrder);
router.get("/myorders", protect, getUserOrders);

// Admin Routes (Add admin middleware here later in production)
router.get("/all", getAllOrders); 
router.patch("/:orderId/status", updateOrderStatus);

// Dynamic ID route must go last
router.get("/:orderId", optionalAuth, getOrderById);

export default router;