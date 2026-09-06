import express from "express";
import { createOrder, getUserOrders } from "../controllers/order.controller.js";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Uses optionalAuth so both logged-in users and guests can check out
router.post("/", optionalAuth, createOrder);

// Strictly protected so users only see their own orders
router.get("/myorders", protect, getUserOrders);

export default router;