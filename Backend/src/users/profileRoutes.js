import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getProfile, updateProfile } from "../users/profileController.js";

const router = Router();

router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);

export default router;
