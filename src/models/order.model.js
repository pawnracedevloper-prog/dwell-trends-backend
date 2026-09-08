import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false },
  name: { type: String, required: true },
  selectedSize: { type: String, default: "Free Size" },
  selectedColour: { type: String, default: "Standard" },
  qty: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestEmail: { type: String },
    items: [orderItemSchema],

    totalMrp: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    finalTotal: { type: Number, required: true },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pinCode: { type: String, required: true },
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    tokensEarned: {
      type: Number,
      default: 0,
    },

    paymentMethod: { type: String, default: "upi" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },

    // Method 1 Verification Fields
    paymentUtr: { type: String, default: "" }, // 12-digit UPI Ref/UTR entered by customer
    upiTransactionRef: { type: String, default: "" }, // DT_orderId
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);