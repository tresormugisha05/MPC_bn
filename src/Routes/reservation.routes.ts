import { Router } from "express";
import * as ReservationController from "../controller/Reservation.controller";
import { authenticate } from "../controller/User.controller";

const router = Router();

router.post("/", authenticate, ReservationController.createReservation);
router.get("/:id", ReservationController.getReservation);
router.post("/:id/cancel", authenticate, ReservationController.cancelReservation);
router.get("/users/:userId/reservations", ReservationController.getUserReservations);

export default router;
