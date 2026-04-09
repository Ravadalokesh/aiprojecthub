import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

interface JWTPayload {
  userId: string;
  role: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(401).json({
      success: false,
      message: errorMsg.includes("expired")
        ? "Token has expired. Please sign in again."
        : "Invalid or expired token",
    });
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }

    next();
  } catch (_error) {
    next();
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.userRole !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }

  next();
};

export const managerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.userRole !== "manager" && req.userRole !== "admin") {
    res
      .status(403)
      .json({ success: false, message: "Manager access required" });
    return;
  }

  next();
};
