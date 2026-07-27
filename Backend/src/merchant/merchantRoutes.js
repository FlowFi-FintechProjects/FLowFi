import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getStats, getTransactions, getRevenueChart } from "../merchant/merchantController.js";

const router = Router();

router.get("/stats", protect, getStats);
router.get("/transactions", protect, getTransactions);
router.get("/revenue", protect, getRevenueChart);

export default router;