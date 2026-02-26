import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi = require("swagger-ui-express");
import prisma from "./lib/prisma";
import { authRoutes, usersRoutes, productRoutes, reservationRoutes, orderRoutes } from "./Routes";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { startReservationExpiryJob } from "./jobs/reservationExpiry";
import { config } from "./config";
import { swaggerSpec } from "./config/swagger";
dotenv.config();

const app = express();
const PORT = config.server.port;
app.use(helmet());
app.use(cors({
  origin: [
    "https://mpctest-black.vercel.app",
    "https://mpctest-git-master-tresor-mugishas-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(requestLogger);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/products", productRoutes);
app.use("/reservations", reservationRoutes);
app.use("/orders", orderRoutes);
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
