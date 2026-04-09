import express, { Router, Request, Response, NextFunction } from "express";
import { signUp, signIn, getCurrentUser } from "../services/authService";
import { authMiddleware } from "../middleware/auth";

const router: Router = express.Router();

// Sign Up
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await signUp(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Sign In
router.post(
  "/signin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await signIn(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// Get Current User
router.get(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getCurrentUser(req.userId!);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
);

// Logout (client-side token removal, but we can invalidate on backend if needed)
router.post("/logout", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default router;
