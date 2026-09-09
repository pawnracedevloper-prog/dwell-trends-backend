import { Campaign } from "../models/campaign.model.js";
import { Product } from "../models/product.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

// GET /api/v1/campaigns/active (Public - for Hero)
export const getActiveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ isActive: true })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/campaigns/all (Admin - List all campaigns)
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/campaigns (Admin - Create new campaign)
export const createCampaign = async (req, res) => {
  try {
    const { title, tagline, badgeText, itemsJson, themeColor, expiresAt } = req.body;
    const parsedItems = JSON.parse(itemsJson || "[]");

    let bannerImage = { url: "", public_id: "" };
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, "dwell_trends_campaigns");
      if (uploadResult) {
        bannerImage = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
      }
    }

    await Campaign.updateMany({}, { isActive: false });

    const campaign = await Campaign.create({
      title: title || "Dwell Grand Gala",
      tagline,
      badgeText,
      themeColor,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      bannerImage,
      isActive: true,
      items: parsedItems.map((item) => ({
        product: item.productId,
        eventPrice: Number(item.eventPrice),
      })),
    });

    for (const item of parsedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        dealType: "Wow",
        dealPrice: Number(item.eventPrice),
      });
    }

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/campaigns/:id (Admin - Update existing campaign)
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tagline, badgeText, itemsJson, themeColor, expiresAt, isActive } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (title) campaign.title = title;
    if (tagline !== undefined) campaign.tagline = tagline;
    if (badgeText) campaign.badgeText = badgeText;
    if (themeColor) campaign.themeColor = themeColor;
    if (expiresAt !== undefined) campaign.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) campaign.isActive = Boolean(isActive);

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, "dwell_trends_campaigns");
      if (uploadResult) {
        campaign.bannerImage = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
      }
    }

    if (itemsJson) {
      const parsedItems = JSON.parse(itemsJson);
      campaign.items = parsedItems.map((item) => ({
        product: item.productId,
        eventPrice: Number(item.eventPrice),
      }));

      // Update product deal overrides
      for (const item of parsedItems) {
        await Product.findByIdAndUpdate(item.productId, {
          dealType: "Wow",
          dealPrice: Number(item.eventPrice),
        });
      }
    }

    if (campaign.isActive) {
      // Ensure only this campaign is active
      await Campaign.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    await campaign.save();
    res.status(200).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/campaigns/:id (Admin - Delete campaign)
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Reset deal status for products in this campaign
    if (campaign.items && campaign.items.length > 0) {
      const productIds = campaign.items.map((i) => i.product);
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { dealType: "None", dealPrice: null } }
      );
    }

    res.status(200).json({ success: true, message: "Campaign removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};