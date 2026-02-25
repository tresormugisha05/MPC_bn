import { z } from "zod";

/**
 * User validation schemas using Zod
 */

// Register validation schema
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Types derived from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
