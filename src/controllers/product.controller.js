import { Product } from "../models/product.model.js";
import cloudinary, { uploadBufferToCloudinary } from "../utils/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const { name, brand, mainCategory, subCategory, category, description, price, mrp, dealType, dealPrice, variants, fabric, work, details, isNewItem } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      const imageUploadPromises = req.files.map((file) => {
        if (!file.buffer) {
          throw new Error("File buffer missing. Ensure multer memoryStorage is configured.");
        }
        return uploadBufferToCloudinary(file.buffer, "dwell_trends_products");
      });

      const uploadedImages = await Promise.all(imageUploadPromises);

      images = uploadedImages
        .filter((img) => img && img.public_id)
        .map((img) => ({
          public_id: img.public_id,
          url: img.secure_url,
        }));
    }

    const parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details;

    const product = new Product({
      name,
      brand: brand || "Dwell Trends",
      mainCategory,
      subCategory: subCategory || category, 
      category: category || subCategory,
      description,
      price: Number(price),
      mrp: Number(mrp),
      dealType: dealType || "None",
      dealPrice: dealPrice ? Number(dealPrice) : null,
      variants: parsedVariants,
      images,
      fabric,
      work,
      details: parsedDetails,
      isNewItem: isNewItem === "true" || isNewItem === true,
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { mainCategory, subCategory, category, search, minPrice, maxPrice, dealType, sort } = req.query;
    let query = {};

    if (mainCategory) query.mainCategory = mainCategory;
    if (subCategory) query.subCategory = subCategory;
    if (category && category !== "all") query.category = category;
    if (dealType) query.dealType = dealType;
    
    if (search) query.name = { $regex: search, $options: "i" };
    
    // Advanced Price Filtering matching standard OR deal price
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      
      query.$or = [
        { dealType: "None", price: priceFilter },
        { dealType: { $ne: "None" }, dealPrice: priceFilter }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { price: 1 };
    if (sort === "price-desc") sortOption = { price: -1 };

    const products = await Product.find(query).sort(sortOption);
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const { name, brand, mainCategory, subCategory, category, description, price, mrp, dealType, dealPrice, variants, fabric, work, details, isNewItem } = req.body;

    let updatedImages = product.images;
    if (req.files && req.files.length > 0) {
      for (const img of product.images) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }

      const imageUploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, "dwell_trends_products")
      );
      const uploadedImages = await Promise.all(imageUploadPromises);
      updatedImages = uploadedImages
        .filter((img) => img && img.public_id)
        .map((img) => ({
          public_id: img.public_id,
          url: img.secure_url,
        }));
    }

    const parsedVariants = variants ? (typeof variants === "string" ? JSON.parse(variants) : variants) : product.variants;
    const parsedDetails = details ? (typeof details === "string" ? JSON.parse(details) : details) : product.details;

    product = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        brand: brand || product.brand,
        mainCategory: mainCategory || product.mainCategory,
        subCategory: subCategory || product.subCategory,
        category: category || product.category,
        description: description || product.description,
        price: price ? Number(price) : product.price,
        mrp: mrp ? Number(mrp) : product.mrp,
        dealType: dealType || product.dealType,
        dealPrice: dealType === "None" ? null : (dealPrice ? Number(dealPrice) : product.dealPrice),
        variants: parsedVariants,
        images: updatedImages,
        fabric: fabric || product.fabric,
        work: work || product.work,
        details: parsedDetails,
        isNewItem: isNewItem !== undefined ? (isNewItem === "true" || isNewItem === true) : product.isNewItem,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Controller: Bulk Update Deals (Hot/Wow)
export const updateDealStatus = async (req, res) => {
  try {
    const { productIds, dealType, dealPrice } = req.body;
    
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { dealType, dealPrice: dealType === "None" ? null : Number(dealPrice) } }
    );

    res.status(200).json({ success: true, message: "Deals updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    for (const image of product.images) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};