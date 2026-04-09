import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "../services/teamService";

const router: Router = express.Router();

router.use(authMiddleware);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await createTeam(req.userId!, req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await getTeams(req.userId!);
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const team = await getTeamById(req.params.id, req.userId!);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const team = await updateTeam(req.params.id, req.userId!, req.body);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await deleteTeam(req.params.id, req.userId!);
      res.status(200).json({ success: true, message: "Team deleted" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/members",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const team = await addTeamMember(req.params.id, req.userId!, email);
      res.status(200).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id/members/:memberId",
  async (req: Request<{ id: string; memberId: string }>, res: Response, next: NextFunction) => {
    try {
      const team = await removeTeamMember(
        req.params.id,
        req.userId!,
        req.params.memberId,
      );
      res.status(200).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
