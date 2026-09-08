import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  submitOrderUtr,
} from "../controllers/order.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", optionalAuth, createOrder);
router.get("/myorders", protect, getUserOrders);

// Admin & Mutation Routes
router.get("/all", getAllOrders);
router.patch("/:orderId/status", updateOrderStatus);
router.patch("/:orderId/utr", submitOrderUtr);

// Dynamic ID Route (Must stay at the bottom)
router.get("/:orderId", optionalAuth, getOrderById);

export default router;