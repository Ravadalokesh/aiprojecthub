import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, unknown>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const normalizedError = normalizeError(err);
  const statusCode =
    normalizedError.statusCode || normalizedError.status || 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : normalizedError.message || "Internal Server Error";

  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: normalizedError.stack,
    }),
  });
};

const normalizeError = (err: AppError): AppError => {
  if (
    err instanceof ValidationError ||
    err instanceof NotFoundError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError
  ) {
    return err;
  }

  if (err instanceof TokenExpiredError) {
    const tokenError = new UnauthorizedError(
      "Token has expired. Please sign in again.",
    );
    tokenError.stack = err.stack;
    return tokenError;
  }

  if (err instanceof JsonWebTokenError) {
    const tokenError = new UnauthorizedError("Invalid authentication token.");
    tokenError.stack = err.stack;
    return tokenError;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return new ValidationError(
      Object.values(err.errors)
        .map((item) => item.message)
        .join(", "),
    );
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0];
    return new ValidationError(
      duplicateField
        ? `${duplicateField} already exists`
        : "A record with these details already exists",
    );
  }

  return err;
};

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  status = 404;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  status = 403;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
