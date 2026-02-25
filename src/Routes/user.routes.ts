import { Router } from "express";
import * as UserController from "../controller/User.controller";

const router = Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);

export default router;
