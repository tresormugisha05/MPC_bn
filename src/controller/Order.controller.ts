import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { z } from "zod";

type PrismaTx = Prisma.TransactionClient;

// Zod validation schema - user_id removed, will be extracted from JWT
const createOrderSchema = z.object({
  reservation_id: z.string().uuid(),
});

// ─── Order Controllers ─────────────────────────────────────────────────────

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order (checkout from reservation)
 *     tags: [Orders]
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
 *               - reservation_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               reservation_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed or reservation not valid
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
 *         description: Reservation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: List all orders (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
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
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user_id from JWT token (set by authenticate middleware)
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized - user not found" });
      return;
    }

    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
      return;
    }

    const { reservation_id } = validation.data;

    const result = await prisma.$transaction(async (tx: PrismaTx) => {
      // Find the reservation
      const reservation = await tx.reservation.findUnique({
        where: { id: reservation_id },
        include: { product: true },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Use user_id from JWT token instead of request body
      if (reservation.user_id !== userId) {
        throw new Error("Reservation does not belong to this user");
      }

      if (reservation.status !== "pending") {
        throw new Error("Reservation is not pending");
      }

      if (reservation.expires_at < new Date()) {
        throw new Error("Reservation has expired");
      }

      // Calculate total price at current product price
      const total_price = Number(reservation.product.price) * reservation.quantity;

      // Create the order
      const order = await tx.order.create({
        data: {
          user_id: userId,
          reservation_id,
          product_id: reservation.product_id,
          quantity: reservation.quantity,
          total_price,
        },
      });

      // Update reservation status to completed
      await tx.reservation.update({
        where: { id: reservation_id },
        data: { status: "completed" },
      });

      // Create inventory log for checkout
      await tx.inventoryLog.create({
        data: {
          product_id: reservation.product_id,
          change: -reservation.quantity,
          reason: "checkout",
          reservation_id: reservation.id,
          stock_before: reservation.product.stock,
          stock_after: reservation.product.stock - reservation.quantity,
        },
      });

      return { order, reservation, product: reservation.product };
    });

    res.status(201).json({
      order: result.order,
      message: "Order created successfully",
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    
    // Return 404 for not found errors
    if (message === "Reservation not found") {
      res.status(404).json({ error: message });
      return;
    }
    
    // Return 409 for conflict errors
    if (
      message === "Reservation does not belong to this user" ||
      message === "Reservation is not pending" ||
      message === "Reservation has expired"
    ) {
      res.status(409).json({ error: message });
      return;
    }
    
    res.status(400).json({ error: message });
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a single order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
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
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const order = await prisma.order.findUnique({
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
        reservation: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

/**
 * @swagger
 * /users/{userId}/orders:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        product: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

/**
 * GET /orders
 * Get all orders (admin)
 */
export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
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
      orderBy: { created_at: "desc" },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error listing orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};
