import express from "express";
import {
  blockDoctor,
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  bookAppointment,
  getDoctorAppointmentsByDate,
  getAppointmentsByDate,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getAdminDashboardStats,
} from "../controllers/doctorController";
import { getAuditLogs } from "../controllers/auditController";
import {
  blockReceptionist,
  createReceptionist,
  getReceptionistById,
  getReceptionists,
  updateReceptionist,
} from "../controllers/receptionistController";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

// Doctor management
router.post("/doctor", verifyToken, authorizeRoles("super_admin"), createDoctor);
router.get(
  "/doctors",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  getDoctors
);
router.get("/doctors/:id", verifyToken, authorizeRoles("super_admin"), getDoctorById);
router.put("/doctors/:id", verifyToken, authorizeRoles("super_admin"), updateDoctor);
router.put("/doctors/:id/block", verifyToken, authorizeRoles("super_admin"), blockDoctor);

// Appointment booking (admin + receptionist)
router.post(
  "/appointments/book",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  bookAppointment
);
router.get(
  "/appointments/doctor/:doctorId",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  getDoctorAppointmentsByDate
);

// Today's appointments list + actions (admin + receptionist)
router.get(
  "/appointments",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  getAppointmentsByDate
);
router.patch(
  "/appointments/:id/status",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  updateAppointmentStatus
);
router.put(
  "/appointments/:id",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  updateAppointment
);
router.delete(
  "/appointments/:id",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  deleteAppointment
);

// Admin dashboard stats & activity
router.get(
  "/dashboard/stats",
  verifyToken,
  authorizeRoles("super_admin"),
  getAdminDashboardStats
);

// Audit logs
router.get(
  "/audit-logs",
  verifyToken,
  authorizeRoles("super_admin"),
  getAuditLogs
);

// Patient search (admin + receptionist)
router.get(
  "/patients/search",
  verifyToken,
  authorizeRoles("super_admin", "receptionist"),
  async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) return res.status(200).json({ success: true, data: [] });

      const Patient = (await import("../models/Patient")).default;
      const mongoose = await import("mongoose");

      const isObjectId = mongoose.Types.ObjectId.isValid(q);
      const mobileLike = q.replace(/[^\d+]/g, "");

      // Search by: id (if valid), exact mobile, partial mobile, or name partial
      const patients = await Patient.find({
        $or: [
          ...(isObjectId ? [{ _id: q }] : []),
          { mobile: q },
          ...(mobileLike ? [{ mobile: new RegExp(mobileLike, "i") }] : []),
          { name: new RegExp(q, "i") },
        ],
      })
        .limit(10)
        .sort({ updatedAt: -1 });

      return res.status(200).json({ success: true, data: patients });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Receptionist management
router.post(
  "/receptionist",
  verifyToken,
  authorizeRoles("super_admin"),
  createReceptionist
);
router.get(
  "/receptionists",
  verifyToken,
  authorizeRoles("super_admin"),
  getReceptionists
);
router.get(
  "/receptionists/:id",
  verifyToken,
  authorizeRoles("super_admin"),
  getReceptionistById
);
router.put(
  "/receptionists/:id",
  verifyToken,
  authorizeRoles("super_admin"),
  updateReceptionist
);
router.put(
  "/receptionists/:id/block",
  verifyToken,
  authorizeRoles("super_admin"),
  blockReceptionist
);

export default router;