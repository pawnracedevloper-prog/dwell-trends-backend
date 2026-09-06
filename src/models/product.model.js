import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  colourName: { type: String, required: true },
  colourHex: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: "Saanvi Fashion" },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true },
    
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    
    // Tracks specific combinations of size/color for precise inventory
    variants: [variantSchema],
    
    // Cloudinary setup
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      }
    ],
    
    fabric: { type: String },
    work: { type: String },
    details: [{ type: String }], // Array of bullet points
    
    isNewItem: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);