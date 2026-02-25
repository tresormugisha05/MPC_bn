import { Request, Response, NextFunction } from "express";
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
  );
  res.status(500).json({ error: "Internal server error" });
};
