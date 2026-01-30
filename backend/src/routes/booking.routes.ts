import { Router } from "express";
import * as bookingController from "../controllers/booking.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/bookings", authenticate, bookingController.createBooking);

router.get("/bookings", authenticate, bookingController.getUserBookings);

router.get("/bookings/:id", authenticate, bookingController.getBookingById);

router.put(
  "/bookings/:id/cancel",
  authenticate,
  bookingController.cancelBooking,
);

router.get(
  "/admin/bookings",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  bookingController.getAllBookings,
);

export default router;
