import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMoney, requestMoney, getTransactions } from "../payments/paymentController.js";
import { generateQR, payViaQR } from "../payments/qrController.js";

const router = Router();

router.post("/send", protect, sendMoney);
router.post("/request", protect, requestMoney);
router.get("/transactions", protect, getTransactions);
router.post("/qr/generate", protect, generateQR);
router.post("/qr/pay", protect, payViaQR);

export default router;
