import { Router } from "express";
import * as OrderController from "../controller/Order.controller";
import { authenticate } from "../controller/User.controller";

const router = Router();

router.post("/", authenticate, OrderController.createOrder);
router.get("/", authenticate, OrderController.listOrders);
router.get("/:id", OrderController.getOrder);
router.get("/users/:userId/orders", OrderController.getUserOrders);

export default router;
