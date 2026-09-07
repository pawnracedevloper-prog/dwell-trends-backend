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

    // Line items snapshot
    items: [orderItemSchema],

    // Financials
    totalMrp: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    finalTotal: { type: Number, required: true },

    // Fulfillment
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pinCode: { type: String, required: true },
    },

    // Processing Status
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cod"],
      default: "upi",
    },
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
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);