import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getWallet, deposit, withdraw } from "./walletController.js";

const router = Router();

router.get("/", protect, getWallet);
router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, withdraw);

export default router;