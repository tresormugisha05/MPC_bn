import { Router } from "express";
import * as UserController from "../controller/User.controller";

const router = Router();

router.get("/me", UserController.authenticate, UserController.getMe);
router.get("/:id", UserController.getUser);

export default router;
