import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from "../services/projectService";

const router: Router = express.Router();

// Public endpoint - Get all projects without authentication
router.get(
  "/public",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Project = require("../models/Project").default;
      const projects = await Project.find({})
        .select(
          "_id name code description members startDate endDate budget status createdAt",
        )
        .limit(50)
        .sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  },
);

// All project routes require authentication
router.use(authMiddleware);

// Create project
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await createProject(req.userId!, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// Get all projects
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await getProjects(
      req.userId!,
      req.query as Record<string, unknown>,
    );
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const project = await getProjectById(req.params.id, req.userId!);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
);

// Update project
router.put(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const project = await updateProject(req.params.id, req.userId!, req.body);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
);

// Delete project
router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await deleteProject(req.params.id, req.userId!);
      res.status(200).json({ success: true, message: "Project deleted" });
    } catch (error) {
      next(error);
    }
  },
);

// Add project member
router.post(
  "/:id/members",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { memberId } = req.body;
      const project = await addProjectMember(
        req.params.id,
        req.userId!,
        memberId,
      );
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
);

// Remove project member
router.delete(
  "/:id/members/:memberId",
  async (
    req: Request<{ id: string; memberId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const project = await removeProjectMember(
        req.params.id,
        req.userId!,
        req.params.memberId,
      );
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
