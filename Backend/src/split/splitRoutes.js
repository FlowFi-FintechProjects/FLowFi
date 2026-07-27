import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getGroups, getGroup, createGroup, settleShare, deleteGroup } from "../split/splitController.js";

const router = Router();

router.get("/groups", protect, getGroups);
router.get("/groups/:id", protect, getGroup);
router.post("/groups", protect, createGroup);
router.post("/groups/:groupId/settle/:memberId", protect, settleShare);
router.delete("/groups/:id", protect, deleteGroup);

export default router;