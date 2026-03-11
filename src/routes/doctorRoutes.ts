import express from "express";
import {
  getDoctorAppointmentsForDoctor,
  getDoctorMe,
  loginDoctor,
  updateDoctorAppointmentNotes,
} from "../controllers/doctorController";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/login", loginDoctor);

router.get("/me", verifyToken, authorizeRoles("doctor"), getDoctorMe);
router.get(
  "/appointments",
  verifyToken,
  authorizeRoles("doctor"),
  getDoctorAppointmentsForDoctor
);
router.patch(
  "/appointments/:id/notes",
  verifyToken,
  authorizeRoles("doctor"),
  updateDoctorAppointmentNotes
);

export default router;

