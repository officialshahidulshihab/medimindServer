import { Request, Response } from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { DrugCheck, IDrugCheck } from "../models/DrugCheck.js";

export const saveDrugCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { medications, interactionMatrix, dangerFlags, overallRiskLevel } =
      req.body;

    if (
      !medications ||
      !Array.isArray(medications) ||
      medications.length === 0
    ) {
      res
        .status(400)
        .json({ success: false, message: "Medications array is required" });
      return;
    }

    const drugCheck = await DrugCheck.create({
      userId,
      medications,
      interactionMatrix,
      dangerFlags: dangerFlags || [],
      overallRiskLevel,
    });

    res.status(201).json({ success: true, data: drugCheck });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error saving drug check",
      });
  }
};

export const getDrugChecks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const checks = await DrugCheck.find({
      userId,
    } as FilterQuery<IDrugCheck>).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: checks });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching drug checks",
      });
  }
};
