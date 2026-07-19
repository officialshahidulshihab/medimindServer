import { Request, Response } from 'express';
import { UserHealthProfile } from '../models/UserHealthProfile';

export const getHealthProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await UserHealthProfile.findOne({ userId });
    
    if (!profile) {
      res.status(200).json({ success: true, data: {} });
      return;
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching health profile' });
  }
};

export const upsertHealthProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { age, gender, bloodType, allergies, chronicConditions, currentMedications } = req.body;

    const profile = await UserHealthProfile.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          age, 
          gender, 
          bloodType, 
          allergies: allergies || [], 
          chronicConditions: chronicConditions || [], 
          currentMedications: currentMedications || [] 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error updating health profile' });
  }
};
