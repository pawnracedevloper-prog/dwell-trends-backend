import { Product } from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, mrp, variants, fabric, work, details, isNewItem } = req.body;

    // Assuming multer is configured to pass files in req.files
    const imageUploadPromises = req.files.map((file) =>
      cloudinary.uploader.upload(file.path, { folder: "saanvi_products" })
    );
    const uploadedImages = await Promise.all(imageUploadPromises);

    const images = uploadedImages.map((img) => ({
      public_id: img.public_id,
      url: img.secure_url,
    }));

    const product = new Product({
      name, brand, category, description, price, mrp, variants: JSON.parse(variants),
      images, fabric, work, details: JSON.parse(details), isNewItem
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};