import express from "express";
import { 
  getActiveCampaign, 
  getAllCampaigns, 
  createCampaign, 
  updateCampaign, 
  deleteCampaign 
} from "../controllers/campaign.controller.js";
import { protect, admin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/active", getActiveCampaign);
router.get("/all", protect, admin, getAllCampaigns);
router.post("/", protect, admin, upload.single("banner"), createCampaign);
router.put("/:id", protect, admin, upload.single("banner"), updateCampaign);
router.delete("/:id", protect, admin, deleteCampaign);

export default router;