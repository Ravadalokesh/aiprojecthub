import dotenv from "dotenv";

dotenv.config();

const DEFAULT_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const normalizeList = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const unique = <T>(values: T[]) => [...new Set(values)];

const nodeEnv = process.env.NODE_ENV?.trim() || "development";
const isProduction = nodeEnv === "production";

const configuredOrigins = unique([
  ...normalizeList(process.env.ALLOWED_ORIGINS),
  ...(process.env.FRONTEND_URL?.trim()
    ? [process.env.FRONTEND_URL.trim()]
    : []),
  ...(!isProduction ? DEFAULT_DEV_ORIGINS : []),
]);

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongodbUri:
    process.env.MONGODB_URI?.trim() ||
    "mongodb://localhost:27017/projectmanagement",
  jwtSecret: process.env.JWT_SECRET?.trim() || "",
  jwtExpire: process.env.JWT_EXPIRE?.trim() || "7d",
  allowedOrigins: configuredOrigins,
  apiRateLimitWindowMs: Number(
    process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  ),
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 300),
  authRateLimitWindowMs: Number(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  ),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
};

const looksUnsafeSecret = (secret: string) =>
  !secret ||
  secret.length < 12 ||
  [
    "secret",
    "your_jwt_secret_key",
    "your_jwt_secret_key_change_this",
    "change-me",
  ].includes(secret);

export const validateEnv = () => {
  if (!Number.isFinite(env.port) || env.port <= 0) {
    throw new Error("PORT must be a valid positive number.");
  }

  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required.");
  }

  if (looksUnsafeSecret(env.jwtSecret)) {
    throw new Error(
      "JWT_SECRET must be set to a strong value with at least 12 characters.",
    );
  }

  if (env.allowedOrigins.length === 0 && env.isProduction) {
    throw new Error(
      "Set ALLOWED_ORIGINS or FRONTEND_URL before starting the production server.",
    );
  }
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const originAllowed = (origin: string) =>
  env.allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === "*") {
      return true;
    }

    if (allowedOrigin === origin) {
      return true;
    }

    if (!allowedOrigin.includes("*")) {
      return false;
    }

    const pattern = new RegExp(
      `^${allowedOrigin.split("*").map(escapeRegex).join(".*")}$`,
      "i",
    );

    return pattern.test(origin);
  });
