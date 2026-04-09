import express, { Router, Request, Response, NextFunction } from "express";
import {
  parseTaskDescription,
  generateTaskRecommendations,
  predictProjectTimeline,
  analyzeProjectHealth,
  generateChatReply,
} from "../services/aiService";

const router: Router = express.Router();

// Parse task description with NLP
router.post(
  "/parse-task",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, projectContext } = req.body;
      const parsed = await parseTaskDescription(
        description,
        projectContext || "",
      );
      res.status(200).json({ success: true, data: parsed });
    } catch (error) {
      next(error);
    }
  },
);

// Get AI recommendations for project
router.get(
  "/recommendations/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const recommendations = await generateTaskRecommendations(
        req.params.projectId,
        req.userId!,
      );
      res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  },
);

// Get project timeline prediction
router.get(
  "/predictions/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const prediction = await predictProjectTimeline(req.params.projectId);
      res.status(200).json({ success: true, data: prediction });
    } catch (error) {
      next(error);
    }
  },
);

// Analyze project health
router.get(
  "/health/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const health = await analyzeProjectHealth(req.params.projectId);
      res.status(200).json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  },
);

// AI Chat assistant
router.post(
  "/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, projectContext } = req.body;
      if (!message || !String(message).trim()) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      const chatResponse = await generateChatReply(message, projectContext);
      res.status(200).json({ success: true, data: chatResponse });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
