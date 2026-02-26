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

    // Detailed error messages for debugging 401 issues
    if (!authHeader) {
      res.status(401).json({ 
        error: "Authorization header missing",
        message: "Please login to make a reservation",
        code: "NO_AUTH_HEADER"
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ 
        error: "Invalid authorization format",
        message: "Token should be sent as 'Bearer <token>'",
        code: "INVALID_AUTH_FORMAT"
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim() === "") {
      res.status(401).json({ 
        error: "Token is empty",
        message: "Please provide a valid token",
        code: "EMPTY_TOKEN"
      });
      return;
    }
    
    // Debug: Log token info (remove in production)
    console.log("JWT Secret being used:", config.jwt.secret ? "SET" : "NOT SET");
    console.log("Token received, length:", token.length);
    
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
    };

    if (!decoded.userId) {
      res.status(401).json({ 
        error: "Invalid token payload",
        message: "Token does not contain user information",
        code: "INVALID_TOKEN_PAYLOAD"
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error instanceof Error ? error.message : "Unknown error");
    
    // Provide more specific error messages
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: "Token expired",
        message: "Please login again to continue",
        code: "TOKEN_EXPIRED"
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: "Invalid token",
        message: "Please login again",
        code: "INVALID_TOKEN"
      });
      return;
    }
    
    res.status(401).json({ error: "Authentication failed" });
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
