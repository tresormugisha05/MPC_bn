import "express";

/**
 * Extended Express Request interface to include custom properties
 */
declare global {
  namespace Express {
    interface Request {
      user:{
      userId?: string;
      }
    }
  }
}

export {};
