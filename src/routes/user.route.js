import express from "express";
import { 
  registerUser, 
  loginUser, 
  toggleWishlist, 
  updateUserProfile, 
  directResetPassword ,
  getUserProfile,
  logoutUser
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/reset-password", directResetPassword);
router.post("/wishlist", protect, toggleWishlist);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;