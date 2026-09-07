import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      totalMrp,
      discount,
      shippingFee,
      finalTotal,
      guestEmail,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No order items provided." });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: "Incomplete shipping address." });
    }

    // 1. Process items, validate IDs, and update stock safely
    const formattedItems = [];

    for (const item of items) {
      const rawId = item.product || item.productId || item._id;
      const isValidId = mongoose.Types.ObjectId.isValid(rawId);

      if (isValidId) {
        const product = await Product.findById(rawId);
        if (product && product.variants && product.variants.length > 0) {
          const variantIndex = product.variants.findIndex(
            (v) =>
              (v.size || "").toLowerCase() === (item.selectedSize || item.size || "").toLowerCase() &&
              (v.colourName || "").toLowerCase() === (item.selectedColour || item.colour || "").toLowerCase()
          );

          if (variantIndex !== -1 && product.variants[variantIndex].stock >= item.qty) {
            product.variants[variantIndex].stock -= Number(item.qty);
            await product.save();
          }
        }
      }

      formattedItems.push({
        product: isValidId ? rawId : null,
        name: item.name || "Product",
        selectedSize: item.selectedSize || item.size || "Free Size",
        selectedColour: item.selectedColour || item.colour || "Standard",
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        image: item.image || "",
      });
    }

    // 2. Create Order
    const order = new Order({
      user: req.user ? req.user._id : null,
      guestEmail: guestEmail || (req.user ? req.user.email : undefined),
      items: formattedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pinCode: shippingAddress.pinCode || shippingAddress.pincode || "",
      },
      paymentMethod: paymentMethod || "upi",
      paymentStatus: "Pending",
      orderStatus: "Processing",
      totalMrp: Number(totalMrp) || Number(finalTotal) || 0,
      discount: Number(discount) || 0,
      shippingFee: Number(shippingFee) || 0,
      finalTotal: Number(finalTotal) || 0,
    });

    await order.save();
    return res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID format." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Allow access if guest tracking or matching user
    if (order.user && req.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to order" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID format." });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus, paymentStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};