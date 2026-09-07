import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalMrp, discount, shippingFee, finalTotal, guestEmail } = req.body;

    // 1. Check and decrement stock for each variant
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product ${item.name} not found`);

      const variantIndex = product.variants.findIndex(
        (v) => v.size === item.selectedSize && v.colourName === item.selectedColour
      );

      if (variantIndex === -1 || product.variants[variantIndex].stock < item.qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
      }

      // Deduct stock
      product.variants[variantIndex].stock -= item.qty;
      await product.save();
    }

    // 2. Create Order
    const order = new Order({
      user: req.user ? req.user._id : null,
      guestEmail,
      items,
      shippingAddress,
      paymentMethod,
      totalMrp,
      discount,
      shippingFee,
      finalTotal,
    });

    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Allow access if the requester is the order owner or a guest tracking by order ID
    if (order.user && req.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to order" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};