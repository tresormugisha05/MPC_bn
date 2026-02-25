import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateProductInput, UpdateProductInput } from "../models/product.model";
import { z } from "zod";

// Zod validation schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  image_url: z.string().optional(),
  is_active: z.boolean().optional(),
  owner_id: z.string().uuid(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  image_url: z.string().optional(),
  is_active: z.boolean().optional(),
});

// ─── Product Controllers ─────────────────────────────────────────────────────

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List all active products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true } as any,
      orderBy: { created_at: "desc" } as any,
    });

    res.json(products);
  } catch (error) {
    console.error("Error listing products:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch products", details: message });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id } as any,
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation failed
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[CREATE PRODUCT] Request body:", JSON.stringify(req.body));
    console.log("[CREATE PRODUCT] User from token:", (req as any).user);

    const validation = createProductSchema.safeParse(req.body);

    if (!validation.success) {
      console.log("[CREATE PRODUCT] Validation failed:", validation.error.issues);
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
      return;
    }

    const data: CreateProductInput = validation.data;
    console.log("[CREATE PRODUCT] Validated data:", JSON.stringify(data));

    // Get the owner_id from request body
    const ownerId = data.owner_id;
    console.log("[CREATE PRODUCT] Owner ID from request:", ownerId);

    if (!ownerId) {
      res.status(400).json({ error: "owner_id is required" });
      return;
    }

    // Check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, role: true },
    });
    console.log("[CREATE PRODUCT] User exists in DB:", userExists);

    if (!userExists) {
      res.status(400).json({ error: "Invalid owner_id - user does not exist" });
      return;
    }

    // Create product with owner_id from request body
    console.log("[CREATE PRODUCT] Creating product with owner_id:", ownerId);
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        image_url: data.image_url,
        is_active: data.is_active ?? true,
        owner_id: ownerId,
      } as any,
    });

    console.log("[CREATE PRODUCT] Product created successfully:", product.id);
    res.status(201).json(product);
  } catch (error: any) {
    console.error("[CREATE PRODUCT] Error creating product:", error);
    console.error("[CREATE PRODUCT] Error code:", error?.code);
    console.error("[CREATE PRODUCT] Error message:", error?.message);
    console.error("[CREATE PRODUCT] Error meta:", error?.meta);
    
    // Check for specific Prisma error codes
    if (error?.code === "P2002") {
      res.status(400).json({ error: "A product with this name already exists" });
      return;
    }
    if (error?.code === "P2003") {
      res.status(400).json({ error: "Invalid owner_id - user does not exist" });
      return;
    }
    
    res.status(500).json({ error: "Failed to create product", details: error?.message });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation failed
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const validation = updateProductSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
      return;
    }

    const data: UpdateProductInput = validation.data;

    const product = await prisma.product.update({
      where: { id } as any,
      data,
    });

    res.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    // Prisma error code P2025 means record not found
    if (error?.code === "P2025") {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update product" });
  }
};

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Soft delete a product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const product = await prisma.product.update({
      where: { id } as any,
      data: { is_active: false } as any,
    });

    res.json({ message: "Product deleted", product });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    // Prisma error code P2025 means record not found
    if (error?.code === "P2025") {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete product" });
  }
};
