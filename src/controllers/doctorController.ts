import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Doctor from "../models/Doctor";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";

// Helper to combine date + time
const combineDateTime = (dateStr: string, timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      department,
      specialization,
      date,
      workingHours,
      breakTimes,
      slotDuration,
    } = req.body;

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor)
      return res.status(400).json({ message: "Doctor already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword,
      department,
      specialization,
      workingHours: {
        start: combineDateTime(date, workingHours.start),
        end: combineDateTime(date, workingHours.end),
      },
      breakTimes: breakTimes.map((bt: any) => ({
        start: bt.start ? combineDateTime(date, bt.start) : null,
        end: bt.end ? combineDateTime(date, bt.end) : null,
      })),
      slotDuration,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Doctor login
export const loginDoctor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor)
      return res.status(400).json({ message: "Invalid credentials" });

    if (doctor.isBlocked)
      return res.status(403).json({ message: "Doctor is blocked" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(doctor._id.toString(), "doctor");
    const refreshToken = generateRefreshToken(doctor._id.toString());

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: "doctor",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find().select("-password");
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Block / unblock doctor
export const blockDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);
    if (!doctor)
      return res.status(404).json({ message: "Doctor not found" });

    doctor.isBlocked = !doctor.isBlocked;
    await doctor.save();

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single doctor
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).select("-password");

    if (!doctor)
      return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update doctor
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      password,
      department,
      specialization,
      date,
      workingHours,
      breakTimes,
      slotDuration,
    } = req.body;

    const doctor = await Doctor.findById(id);
    if (!doctor)
      return res.status(404).json({ message: "Doctor not found" });

    if (name !== undefined) doctor.name = name;
    if (email !== undefined) doctor.email = email;
    if (department !== undefined) doctor.department = department;
    if (specialization !== undefined) doctor.specialization = specialization;
    if (slotDuration !== undefined) doctor.slotDuration = slotDuration;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      doctor.password = hashedPassword;
    }

    if (date && workingHours) {
      doctor.workingHours = {
        start: combineDateTime(date, workingHours.start),
        end: combineDateTime(date, workingHours.end),
      };
    }

    if (date && Array.isArray(breakTimes)) {
      doctor.breakTimes = breakTimes.map((bt: any) => ({
        start: bt.start ? combineDateTime(date, bt.start) : null,
        end: bt.end ? combineDateTime(date, bt.end) : null,
      }));
    }

    await doctor.save();

    const updatedDoctor = await Doctor.findById(id).select("-password");
    res.status(200).json({ success: true, data: updatedDoctor });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// BOOK APPOINTMENT (atomic lock via Appointment unique index)
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const {
      doctorId,
      time,
      patientType,
      name,
      mobile,
      age,
      existingIdentifier,
      patientId,
      purpose,
      notes,
    } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const slotStart = new Date(time);
    if (isNaN(slotStart.getTime())) {
      return res.status(400).json({ message: "Invalid time" });
    }
    const slotEnd = new Date(
      slotStart.getTime() + doctor.slotDuration * 60 * 1000
    );

    const user = (req as any).user;

    // Resolve patient details
    let patientRef: any = undefined;
    let resolvedName: string | undefined = undefined;
    let resolvedMobile: string | undefined = undefined;
    let resolvedAge: number | undefined = undefined;

    if (patientType === "new") {
      if (!name || !mobile) {
        return res
          .status(400)
          .json({ message: "Name and mobile are required" });
      }

      const existingPatient = await Patient.findOne({ mobile });
      if (existingPatient) {
        patientRef = existingPatient._id;
        resolvedName = existingPatient.name;
        resolvedMobile = existingPatient.mobile;
        resolvedAge = existingPatient.age;
      } else {
        const created = await Patient.create({ name, mobile, age });
        patientRef = created._id;
        resolvedName = created.name;
        resolvedMobile = created.mobile;
        resolvedAge = created.age;
      }
    } else {
      // existing patient: must supply patientId OR identifier (name/mobile)
      if (patientId) {
        const p = await Patient.findById(patientId);
        if (!p) return res.status(404).json({ message: "Patient not found" });
        patientRef = p._id;
        resolvedName = p.name;
        resolvedMobile = p.mobile;
        resolvedAge = p.age;
      } else if (existingIdentifier) {
        const p = await Patient.findOne({
          $or: [
            { mobile: existingIdentifier },
            { name: new RegExp(existingIdentifier, "i") },
          ],
        });
        if (!p)
          return res.status(404).json({ message: "Patient not found" });
        patientRef = p._id;
        resolvedName = p.name;
        resolvedMobile = p.mobile;
        resolvedAge = p.age;
      } else {
        return res
          .status(400)
          .json({ message: "Select an existing patient" });
      }
    }

    try {
      const appointment = await Appointment.create({
        doctor: doctor._id,
        startTime: slotStart,
        endTime: slotEnd,
        patientType,
        patient: patientRef,
        patientName: resolvedName,
        mobile: resolvedMobile,
        age: resolvedAge,
        existingPatientIdentifier:
          patientType === "existing" ? existingIdentifier : undefined,
        purpose,
        notes,
        createdBy: user.userId,
        createdByRole: user.role,
      });

      return res.status(201).json({ success: true, data: appointment });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "Slot already booked" });
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET APPOINTMENTS FOR DOCTOR + DATE
export const getDoctorAppointmentsByDate = async (
  req: Request,
  res: Response
) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const [y, m, d] = (date as string).split("-").map(Number);
    const start = new Date();
    start.setFullYear(y, m - 1, d);
    start.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      startTime: { $gte: start, $lt: end },
    }).select("startTime endTime");

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAppointmentsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    const iso = typeof date === "string" ? date : new Date().toISOString().slice(0, 10);
    const [y, m, d] = iso.split("-").map(Number);
    const start = new Date();
    start.setFullYear(y, m - 1, d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const appointments = await Appointment.find({
      startTime: { $gte: start, $lt: end },
    })
      .populate("doctor", "name department isBlocked")
      .populate("patient", "name mobile age")
      .sort({ startTime: 1 });

    // Hide appointments for currently blocked doctors
    const visibleAppointments = appointments.filter((appt: any) => {
      const doc = appt.doctor as any;
      return doc && !doc.isBlocked;
    });

    return res.status(200).json({ success: true, data: visibleAppointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: "Booked" | "Arrived" | "Done" };

    if (!["Booked", "Arrived", "Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("doctor", "name department")
      .populate("patient", "name mobile age");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { patientName, mobile, age, purpose, notes } = req.body;

    const existing = await Appointment.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // If appointment is linked to a patient, keep patient record in sync
    if (existing.patient) {
      await Patient.findByIdAndUpdate(existing.patient, {
        ...(patientName !== undefined ? { name: patientName } : {}),
        ...(mobile !== undefined ? { mobile } : {}),
        ...(age !== undefined ? { age } : {}),
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { patientName, mobile, age, purpose, notes },
      { new: true }
    )
      .populate("doctor", "name department")
      .populate("patient", "name mobile age");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getDoctorMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { userId: string; role: string };
    if (!user?.userId) return res.status(401).json({ message: "Unauthorized" });

    const doctor = await Doctor.findById(user.userId).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getDoctorAppointmentsForDoctor = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { date } = req.query;

    const iso =
      typeof date === "string" ? date : new Date().toISOString().slice(0, 10);
    const [y, m, d] = iso.split("-").map(Number);
    const start = new Date();
    start.setFullYear(y, m - 1, d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: user.userId,
      startTime: { $gte: start, $lt: end },
    })
      .sort({ startTime: 1 })
      .select("patientName existingPatientIdentifier startTime purpose status notes");

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateDoctorAppointmentNotes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params;
    const { notes } = req.body as { notes?: string };

    const appt = await Appointment.findOneAndUpdate(
      { _id: id, doctor: user.userId },
      { notes: notes || "" },
      { new: true }
    ).select("patientName existingPatientIdentifier startTime purpose status notes");

    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    return res.status(200).json({ success: true, data: appt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const [y, m, d] = todayIso.split("-").map(Number);
    const start = new Date();
    start.setFullYear(y, m - 1, d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const DoctorModel = Doctor;
    const UserModel = (await import("../models/User")).default;

    const [doctorsCount, staffCount, apptsToday] = await Promise.all([
      DoctorModel.countDocuments(),
      UserModel.countDocuments({ role: "receptionist" }),
      Appointment.countDocuments({ startTime: { $gte: start, $lt: end } }),
    ]);

    // simple recent activity based on latest appointments
    const recentAppointments = await Appointment.find({
      startTime: { $gte: start, $lt: end },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("doctor", "name department")
      .select("patientName existingPatientIdentifier status startTime doctor");

    return res.status(200).json({
      success: true,
      data: {
        doctorsCount,
        staffCount,
        apptsToday,
        recentAppointments,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};