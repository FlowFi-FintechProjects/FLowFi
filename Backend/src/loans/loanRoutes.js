import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { applyLoan, updateLoanStatus, getEMISchedule } from "../loans/loanController.js";

const router = Router();

router.post("/apply", protect, applyLoan);
router.patch("/status", protect, updateLoanStatus);
router.get("/emi/:id", protect, getEMISchedule);

export default router;
