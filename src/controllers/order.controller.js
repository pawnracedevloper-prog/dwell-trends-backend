import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
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
      tokensToUse, // Number of wallet tokens requested to apply
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No order items provided." });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: "Incomplete shipping address." });
    }

    // 1. Process items, validate IDs, and decrement stock
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

    // 2. Token Deduction Logistics (1 Token = ₹1)
    let baseAmount = Number(finalTotal) || 0;
    let appliedTokens = 0;

    if (req.user && tokensToUse > 0) {
      const user = await User.findById(req.user._id);
      if (user && user.walletTokens > 0) {
        appliedTokens = Math.min(Number(tokensToUse), user.walletTokens, baseAmount);
        baseAmount -= appliedTokens;

        // Deduct from DB wallet immediately
        user.walletTokens -= appliedTokens;
        await user.save();
      }
    }

    // Earn 1 Token for every ₹100 spent on the final paid amount
    const tokensEarned = Math.floor(baseAmount / 100);

    // 3. Create Order document
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
      totalMrp: Number(totalMrp) || baseAmount,
      discount: Number(discount) || 0,
      shippingFee: Number(shippingFee) || 0,
      finalTotal: baseAmount,
      tokensUsed: appliedTokens,
      tokensEarned: tokensEarned,
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

    // Prevent unauthorized users from inspecting another account's orders
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

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const wasPaidBefore = order.paymentStatus === "Paid";
    const wasCancelledBefore = order.orderStatus === "Cancelled";

    // 1. Credit earned tokens ONLY when flipping status from unconfirmed to Paid
    if (!wasPaidBefore && paymentStatus === "Paid" && order.user && order.tokensEarned > 0) {
      await User.findByIdAndUpdate(order.user, { $inc: { walletTokens: order.tokensEarned } });
    }

    // 2. Handle Order Cancellation: Refund spent tokens and restore inventory stock
    if (!wasCancelledBefore && orderStatus === "Cancelled") {
      // Refund spent tokens back to user's wallet
      if (order.user && order.tokensUsed > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { walletTokens: order.tokensUsed } });
      }

      // Re-increment stock levels
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(
              (v) =>
                (v.size || "").toLowerCase() === (item.selectedSize || "").toLowerCase() &&
                (v.colourName || "").toLowerCase() === (item.selectedColour || "").toLowerCase()
            );

            if (variantIndex !== -1) {
              product.variants[variantIndex].stock += Number(item.qty);
              await product.save();
            }
          }
        }
      }
    }

    // Update the record
    order.orderStatus = orderStatus || order.orderStatus;
    order.paymentStatus = paymentStatus || order.paymentStatus;
    await order.save();

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitOrderUtr = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { utr } = req.body;

    if (!utr || utr.trim().length < 6) {
      return res.status(400).json({ success: false, message: "Valid UTR or Reference number is required." });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          paymentUtr: utr.trim(),
          upiTransactionRef: `DT_${orderId}`,
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};