import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { Doctor } from '../models/Doctor.js';
import { SymptomSession } from '../models/SymptomSession.js';
import { DrugCheck } from '../models/DrugCheck.js';
import { HealthDocument } from '../models/HealthDocument.js';
import { Appointment } from '../models/Appointment.js';
import mongoose from 'mongoose';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res): Promise<void> => {
  try {
    const [
      totalDoctors,
      verifiedDoctors,
      totalSymptomSessions,
      totalDrugChecks,
      totalDocuments,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ verified: true }),
      SymptomSession.countDocuments(),
      DrugCheck.countDocuments(),
      HealthDocument.countDocuments(),
    ]);

    // Activity chart — last 7 days of symptom sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = await SymptomSession.find({
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = days.map((day, i) => ({
      day,
      sessions: recentSessions.filter(s =>
        new Date(s.createdAt).getDay() === i
      ).length
    }));

    // Recent doctors added (last 5)
    const recentDoctors = await Doctor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name specialty location verified createdAt');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDoctors,
          verifiedDoctors,
          totalSymptomSessions,
          totalDrugChecks,
          totalDocuments,
        },
        chartData,
        recentDoctors,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/doctors/:id/verify — toggle verified status
router.patch('/doctors/:id/verify', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    );
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users — list all users with roles
router.get('/users', async (req, res): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(500).json({ success: false, message: 'Database not connected' });
      return;
    }
    const users = await db.collection('user')
      .find({})
      .project({ name: 1, email: 1, role: 1, createdAt: 1, image: 1 })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['patient', 'admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' });
      return;
    }
    const db = mongoose.connection.db;
    if (!db) {
      res.status(500).json({ success: false, message: 'Database not connected' });
      return;
    }
    await db.collection<any>('user').updateOne(
      { _id: id },
      { $set: { role } }
    );
    res.status(200).json({ success: true, message: 'Role updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/appointments — list all appointments
router.get('/appointments', async (req, res): Promise<void> => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialty')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
