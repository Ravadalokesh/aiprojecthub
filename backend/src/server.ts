import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/database";
import { env, originAllowed, validateEnv } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import teamRoutes from "./routes/teams";
import aiRoutes from "./routes/ai";
import analyticsRoutes from "./routes/analytics";

dotenv.config();
validateEnv();

const app: Express = express();
const httpServer = createServer(app);
app.set("trust proxy", 1);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || originAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new SocketServer(httpServer, {
  cors: corsOptions,
});

const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again shortly.",
  },
});

const apiLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again.",
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use("/api", apiLimiter);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      userId: string;
      role: string;
    };

    socket.data.token = token;
    socket.data.userId = decoded.userId;
    socket.data.userRole = decoded.role;
    next();
  } catch (_error) {
    next(new Error("Authentication error"));
  }
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "ProjectHub API is running",
    environment: env.nodeEnv,
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  socket.on("join-project", (projectId: string) => {
    socket.join(`project-${projectId}`);
    io.to(`project-${projectId}`).emit("user-joined", {
      userId: socket.data.userId,
      timestamp: new Date(),
    });
  });

  socket.on("task-updated", (data) => {
    io.to(`project-${data.projectId}`).emit("task-update", data);
  });

  socket.on("project-updated", (data) => {
    io.to(`project-${data.projectId}`).emit("project-update", data);
  });
});

const PORT = env.port;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("WebSocket server ready");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

export { io };
