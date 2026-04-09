import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getProjectAnalytics,
  getTeamAnalytics,
  getProjectVelocity,
} from "../services/analyticsService";

const router: Router = express.Router();

router.use(authMiddleware);

// Get project analytics
router.get(
  "/projects/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const analytics = await getProjectAnalytics(
        req.params.projectId,
        req.userId!,
      );
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  },
);

// Get user's team analytics
router.get("/team", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getTeamAnalytics(req.userId!);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

// Get project velocity
router.get(
  "/velocity/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const weeks = parseInt(req.query.weeks as string) || 5;
      const velocity = await getProjectVelocity(
        req.params.projectId,
        req.userId!,
        weeks,
      );
      res.status(200).json({ success: true, data: velocity });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
