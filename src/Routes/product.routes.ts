import { Router } from "express";
import * as ProductController from "../controller/Product.controller";
import { authenticate } from "../controller/User.controller";

const router = Router();

router.get("/", ProductController.listProducts);
router.post("/", authenticate, ProductController.createProduct);

router.get("/:id", ProductController.getProduct);
router.put("/:id", authenticate, ProductController.updateProduct);
router.delete("/:id", authenticate, ProductController.deleteProduct);

export default router;
