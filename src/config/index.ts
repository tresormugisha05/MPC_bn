/**
 * Application configuration
 * Centralized configuration constants
 */

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: "7d" as const,
  },
  server: {
    port: process.env.PORT || 5000,
  },
};
