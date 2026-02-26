import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { z } from "zod";

type PrismaTx = Prisma.TransactionClient;

// Zod validation schema - user_id removed, will be extracted from JWT
const createReservationSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
});

// Reservation expires in 5 minutes
const RESERVATION_EXPIRY_MINUTES = 5;

// ─── Reservation Controllers

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: List all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reservations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const listReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        product: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
};

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - product_id
 *               - quantity
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get user_id from JWT token (set by authenticate middleware)
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized - user not found" });
      return;
    }

    const validation = createReservationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
      return;
    }

    const { product_id, quantity } = validation.data;

    // Use transaction with SELECT FOR UPDATE to prevent race conditions
    const result = await prisma.$transaction(async (tx: PrismaTx) => {
      // Use raw query with SELECT FOR UPDATE to lock the product row
      // This prevents race conditions where multiple users try to reserve simultaneously
      const products = await tx.$queryRaw<Array<{
        id: string;
        name: string;
        price: any;
        stock: number;
        is_active: boolean;
      }>>`
        SELECT id, name, price, stock, is_active 
        FROM products 
        WHERE id = ${product_id}::uuid
        FOR UPDATE
      `;

      const product = products[0];

      if (!product) {
        throw new Error("Product not found");
      }

      if (!product.is_active) {
        throw new Error("Product is not available");
      }

      // Check for duplicate pending reservation - user can only have one pending reservation per product
      const existingReservation = await tx.reservation.findFirst({
        where: {
          user_id: userId,
          product_id: product_id,
          status: "pending",
        },
      });

      if (existingReservation) {
        throw new Error("DUPLICATE_RESERVATION");
      }

      // Check stock after acquiring lock (now safe from race conditions)
      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Deduct stock atomically
      const updatedProduct = await tx.product.update({
        where: { id: product_id },
        data: { stock: { decrement: quantity } },
      });

      // Calculate expiry time
      const expires_at = new Date();
      expires_at.setMinutes(expires_at.getMinutes() + RESERVATION_EXPIRY_MINUTES);

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          user_id: userId,
          product_id,
          quantity,
          expires_at,
        },
      });

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          product_id,
          change: -quantity,
          reason: "reserved",
          reservation_id: reservation.id,
          stock_before: product.stock,
          stock_after: updatedProduct.stock,
        },
      });

      return { reservation, product: updatedProduct };
    });

    // Transform snake_case to camelCase for frontend compatibility
    const transformedReservation = {
      id: result.reservation.id,
      productId: result.reservation.product_id,
      userId: result.reservation.user_id,
      quantity: result.reservation.quantity,
      expiresAt: result.reservation.expires_at.toISOString(),
      status: result.reservation.status,
    };

    res.status(201).json(transformedReservation);
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    const message = error instanceof Error ? error.message : "Failed to create reservation";
    
    // Return 404 for not found errors
    if (message === "Product not found" || message === "Product is not available") {
      res.status(404).json({ error: message });
      return;
    }
    
    // Return 409 for conflict errors (insufficient stock or duplicate reservation)
    if (message === "Insufficient stock" || message === "DUPLICATE_RESERVATION") {
      res.status(409).json({ 
        error: message === "DUPLICATE_RESERVATION" 
          ? "You already have a pending reservation for this product" 
          : message 
      });
      return;
    }
    
    res.status(400).json({ error: message });
  }
};

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get a single reservation
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ error: "Failed to fetch reservation" });
  }
};

/**
 * @swagger
 * /users/{userId}/reservations:
 *   get:
 *     summary: Get all reservations for a user
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of user reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getUserReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const reservations = await prisma.reservation.findMany({
      where: { user_id: userId },
      include: {
        product: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(reservations);
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
};

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   post:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Cannot cancel reservation (not pending or not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const result = await prisma.$transaction(async (tx: PrismaTx) => {
      // Find reservation
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      if (reservation.status !== "pending") {
        throw new Error("Can only cancel pending reservations");
      }

      // Restore stock
      const product = await tx.product.update({
        where: { id: reservation.product_id },
        data: { stock: { increment: reservation.quantity } },
      });

      // Update reservation status
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: { status: "cancelled" },
      });

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          product_id: reservation.product_id,
          change: reservation.quantity,
          reason: "cancelled",
          reservation_id: reservation.id,
          stock_before: product.stock - reservation.quantity,
          stock_after: product.stock,
        },
      });

      return { reservation: updatedReservation, product };
    });

    res.json({
      message: "Reservation cancelled",
      reservation: result.reservation,
    });
  } catch (error: any) {
    console.error("Error cancelling reservation:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel reservation";
    
    // Return 404 for not found errors
    if (message === "Reservation not found") {
      res.status(404).json({ error: message });
      return;
    }
    
    // Return 409 for conflict errors (not pending)
    if (message === "Can only cancel pending reservations") {
      res.status(409).json({ error: message });
      return;
    }
    
    res.status(400).json({ error: message });
  }
};
