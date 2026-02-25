import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
// @ts-ignore - swagger-ui-express types issue
import swaggerUi = require("swagger-ui-express");
import prisma from "./lib/prisma";

// Import routes
import { userRoutes, usersRoutes, productRoutes, reservationRoutes, orderRoutes } from "./Routes";

// Import middleware and jobs
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { startReservationExpiryJob } from "./jobs/reservationExpiry";
import { config } from "./config";

// Import swagger spec
import { swaggerSpec } from "./config/swagger";

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.server.port;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use(requestLogger);

// ─── Swagger UI ─────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// GET /api-docs.json - OpenAPI JSON spec
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Auth routes - /auth/register, /auth/login
app.use("/auth", userRoutes);

// User routes - /users/me, /users/:id
app.use("/users", usersRoutes);

// Product routes - /products
app.use("/products", productRoutes);

// Reservation routes - /reservations
app.use("/reservations", reservationRoutes);

// Order routes - /orders
app.use("/orders", orderRoutes);

// ─── Metrics Endpoint ─────────────────────────────────────────────────────────
app.get("/metrics", async (req: Request, res: Response) => {
  try {
    const [
      totalProducts,
      activeReservations,
      expiredReservations,
      completedOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.reservation.count({ where: { status: "pending" } }),
      prisma.reservation.count({ where: { status: "expired" } }),
      prisma.order.count(),
    ]);

    res.json({
      total_products: totalProducts,
      active_reservations: activeReservations,
      expired_reservations: expiredReservations,
      completed_orders: completedOrders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// ─── Start Reservation Expiry Job ───────────────────────────────────────────
startReservationExpiryJob();

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});

export default app;
