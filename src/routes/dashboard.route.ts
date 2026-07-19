import express from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { auth } from "../lib/auth.js";
import { SymptomSession, ISymptomSession } from "../models/SymptomSession.js";
import { HealthDocument, IHealthDocument } from "../models/HealthDocument.js";
import { DrugCheck, IDrugCheck } from "../models/DrugCheck.js";
import { Bookmark, IBookmark } from "../models/Bookmark.js";

const router = express.Router();

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

router.get("/", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Keep userId as string — all schemas define userId as String
    const userId = session.user.id;

    // 1. Get Stats
    const [symptomSessions, documentsUploaded, drugChecks, savedDoctors] =
      await Promise.all([
        SymptomSession.countDocuments({
          userId,
        } as FilterQuery<ISymptomSession>),
        HealthDocument.countDocuments({
          userId,
        } as FilterQuery<IHealthDocument>),
        DrugCheck.countDocuments({ userId } as FilterQuery<IDrugCheck>),
        Bookmark.countDocuments({ userId } as FilterQuery<IBookmark>),
      ]);

    const stats = {
      symptomSessions,
      documentsUploaded,
      drugChecks,
      savedDoctors,
    };

    // 2. Get Recent Activity
    const [symptomRows, docRows, drugRows, docBookmarks] = await Promise.all([
      SymptomSession.find({ userId } as FilterQuery<ISymptomSession>)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      HealthDocument.find({ userId } as FilterQuery<IHealthDocument>)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      DrugCheck.find({ userId } as FilterQuery<IDrugCheck>)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Bookmark.find({ userId } as FilterQuery<IBookmark>)
        .populate("doctorId", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    let activities: any[] = [];

    for (const s of symptomRows) {
      activities.push({
        id: s._id.toString(),
        title:
          s.initialSymptoms && s.initialSymptoms.length > 0
            ? `Symptoms: ${s.initialSymptoms.join(", ")}`
            : "Symptom Check",
        date: timeAgo(new Date(s.createdAt)),
        _rawDate: new Date(s.createdAt),
        status: s.status,
        type: "symptom",
      });
    }

    for (const d of docRows) {
      activities.push({
        id: d._id.toString(),
        title: d.fileName || "Health Document",
        date: timeAgo(new Date(d.createdAt)),
        _rawDate: new Date(d.createdAt),
        status: "completed",
        type: "document",
      });
    }

    for (const dc of drugRows) {
      activities.push({
        id: dc._id.toString(),
        title: `Interaction Check: ${dc.medications?.join(", ") || "Unknown"}`,
        date: timeAgo(new Date(dc.createdAt)),
        _rawDate: new Date(dc.createdAt),
        status: "completed",
        type: "drug",
      });
    }

    for (const b of docBookmarks) {
      const doc = (b as any).doctorId;
      activities.push({
        id: b._id.toString(),
        title: `Saved Dr. ${doc?.name || "Unknown"}`,
        date: timeAgo(new Date(b.createdAt)),
        _rawDate: new Date(b.createdAt),
        status: "completed",
        type: "doctor",
      });
    }

    activities.sort((a, b) => b._rawDate.getTime() - a._rawDate.getTime());
    const recentActivity = activities.slice(0, 5).map((a) => {
      delete a._rawDate;
      return a;
    });

    // 3. Get Chart Data (last 7 days of symptom sessions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = await SymptomSession.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    } as FilterQuery<ISymptomSession>)
      .select("createdAt")
      .lean();

    const dayCounts: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      dayCounts[dayName] = 0;
    }

    for (const s of recentSessions) {
      const dayName = new Date(s.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (dayCounts[dayName] !== undefined) {
        dayCounts[dayName]++;
      }
    }

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      chartData.push({ day: dayName, sessions: dayCounts[dayName] });
    }

    res.json({ stats, recentActivity, chartData });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
});

export default router;
