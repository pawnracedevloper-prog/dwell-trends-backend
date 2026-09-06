import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  selectedSize: { type: String, required: true },
  selectedColour: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Nullable for guest checkouts
    guestEmail: { type: String },
    
    // Line items snapshot
    items: [orderItemSchema],
    
    // Financials
    totalMrp: { type: Number, required: true },
    discount: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    finalTotal: { type: Number, required: true },
    
    // Fulfillment
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
    },
    
    // Processing Status
    paymentMethod: { 
      type: String, 
      enum: ["upi", "card", "cod"], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Paid", "Failed"], 
      default: "Pending" 
    },
    orderStatus: { 
      type: String, 
      enum: ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"], 
      default: "Processing" 
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);