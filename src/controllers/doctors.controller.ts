import { Request, Response } from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { Doctor, IDoctor } from "../models/Doctor.js";
import { Review, IReview } from "../models/Review.js";
import "../models/User.js"; // Ensure User model is registered for population

export const getMyDoctorProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const doctor = await Doctor.findOne({ userId } as FilterQuery<IDoctor>);
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "No doctor profile linked to this account",
      });
      return;
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching profile",
    });
  }
};

export const getDoctors = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      search,
      location,
      consultationMode,
      specialty,
      page = "1",
      limit = "8",
    } = req.query;

    const query: FilterQuery<IDoctor> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: "i" } },
        { specialty: { $regex: search as string, $options: "i" } },
      ];
    }

    if (specialty) {
      query.specialty = { $regex: specialty as string, $options: "i" };
    }

    if (location) {
      query.location = new RegExp(location as string, "i");
    }

    if (consultationMode) {
      query.consultationMode = consultationMode as any;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const doctors = await Doctor.find(query)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Doctor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching doctors",
    });
  }
};

export const getDoctorById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await (Doctor.findById as Function)(id);

    if (!doctor) {
      res.status(404).json({ success: false, message: "Doctor not found" });
      return;
    }

    const reviews = await Review.find({ doctorId: id } as FilterQuery<IReview>)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name image");

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        reviews,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching doctor details",
    });
  }
};

export const createDoctor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const doctor = await Doctor.create({
      ...req.body,
      createdBy: (req as any).user.id,
    });
    res.status(201).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Error creating doctor",
    });
  }
};

export const deleteDoctor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await (Doctor.findByIdAndDelete as Function)(id);

    if (!doctor) {
      res
        .status(404)
        .json({ success: false, message: "Doctor not found or unauthorized" });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: "Doctor deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting doctor",
    });
  }
};

export const selfRegisterDoctor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const existing = await Doctor.findOne({ userId } as FilterQuery<IDoctor>);
    if (existing) {
      res
        .status(409)
        .json({ success: false, message: "You already have a doctor profile" });
      return;
    }

    const { name, specialty, location, consultationMode, subSpecialties } =
      req.body;

    if (!name || !specialty || !location) {
      res.status(400).json({
        success: false,
        message: "Name, specialty and location are required",
      });
      return;
    }

    const doctor = await Doctor.create({
      name,
      specialty,
      location,
      consultationMode: consultationMode || "Both",
      subSpecialties: subSpecialties || [],
      verified: false,
      rating: 0,
      reviewCount: 0,
      userId,
      createdBy: userId,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating doctor profile",
    });
  }
};
