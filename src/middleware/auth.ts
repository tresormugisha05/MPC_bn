import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../lib/prisma";

/**
 * Express middleware to verify JWT token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
    };

    (req as any).user = decoded; // ✅ THIS is correct
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Express middleware to verify admin role
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch user from database to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true } as any,
    }) as { role: string } | null;

    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
