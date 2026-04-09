import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addSubtask,
} from "../services/taskService";

const router: Router = express.Router();

router.use(authMiddleware);

// Create task
router.post(
  "/projects/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const task = await createTask(
        req.params.projectId,
        req.userId!,
        req.body,
      );
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },
);

// Get tasks for project
router.get(
  "/projects/:projectId",
  async (
    req: Request<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const tasks = await getTasks(
        req.params.projectId,
        req.userId!,
        req.query as Record<string, unknown>,
      );
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  },
);

// Get task by ID
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const task = await getTaskById(req.params.id, req.userId!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },
);

// Update task
router.put(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const task = await updateTask(req.params.id, req.userId!, req.body);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },
);

// Delete task
router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await deleteTask(req.params.id, req.userId!);
      res.status(200).json({ success: true, message: "Task deleted" });
    } catch (error) {
      next(error);
    }
  },
);

// Add subtask
router.post(
  "/:id/subtasks",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { title } = req.body;
      const task = await addSubtask(req.params.id, req.userId!, title);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
