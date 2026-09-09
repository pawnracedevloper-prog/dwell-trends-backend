import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      default: "Dwell Grand Gala" 
    },
    tagline: { 
      type: String, 
      default: "Festive Trends & Grand Wardrobe Steals" 
    },
    badgeText: { 
      type: String, 
      default: "GRAND SALE LIVE" 
    },
    bannerImage: {
      url: { type: String, required: true },
      public_id: { type: String },
    },
    themeColor: { 
      type: String, 
      default: "#800020" // Deep Maroon / Burgundy
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    // Array of discounted items specifically configured for this event
    items: [
      {
        product: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        },
        eventPrice: { 
          type: Number, 
          required: true 
        },
      }
    ],
    expiresAt: { 
      type: Date 
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);