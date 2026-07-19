import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { SymptomSession } from '../models/SymptomSession.js';
import { HealthDocument } from '../models/HealthDocument.js';
import { DrugCheck } from '../models/DrugCheck.js';
import { Bookmark } from '../models/Bookmark.js';
import { Appointment } from '../models/Appointment.js';
import { UserHealthProfile } from '../models/UserHealthProfile.js';
import { Doctor } from '../models/Doctor.js';
import mongoose from 'mongoose';

export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const userId = user.id;

    await Promise.all([
      SymptomSession.deleteMany({ userId }),
      HealthDocument.deleteMany({ userId }),
      DrugCheck.deleteMany({ userId }),
      Bookmark.deleteMany({ userId }),
      Appointment.deleteMany({ $or: [{ patientId: userId }, { doctorId: userId }] }),
      UserHealthProfile.deleteOne({ userId }),
      Doctor.deleteMany({ $or: [{ userId }, { createdBy: userId }] }),
    ]);

    // Delete Better Auth records if we can access the session and account tables.
    // The easiest way is directly via mongoose using the db object.
    const db = mongoose.connection.db;
    if (db) {
      await Promise.all([
        db.collection('session').deleteMany({ userId }),
        db.collection('account').deleteMany({ userId }),
      ]);
    }

    await User.deleteOne({ _id: userId });

    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting account' });
  }
};
