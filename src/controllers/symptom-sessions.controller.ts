import { Request, Response } from 'express';
import { SymptomSession, SessionStatus } from '../models/SymptomSession.js';
import { SessionTurn, Role } from '../models/SessionTurn.js';

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { initialSymptoms } = req.body;

    if (!initialSymptoms || !Array.isArray(initialSymptoms) || initialSymptoms.length === 0) {
      res.status(400).json({ success: false, message: 'Initial symptoms are required' });
      return;
    }

    const session = await SymptomSession.create({
      userId,
      initialSymptoms,
      status: SessionStatus.Active
    });

    res.status(201).json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating session' });
  }
};

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const sessions = await SymptomSession.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching sessions' });
  }
};

export const getSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const session = await SymptomSession.findOne({ _id: id, userId });
    
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const turns = await SessionTurn.find({ sessionId: id }).sort({ turnIndex: 1 });

    res.status(200).json({ 
      success: true, 
      data: {
        ...session.toObject(),
        turns
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching session details' });
  }
};

export const addSessionTurn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { role, content } = req.body;

    const session = await SymptomSession.findOne({ _id: id, userId });
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    if (session.status === SessionStatus.Completed) {
      res.status(400).json({ success: false, message: 'Session is already completed' });
      return;
    }

    const turnCount = await SessionTurn.countDocuments({ sessionId: id });
    const turnIndex = turnCount;

    const turn = await SessionTurn.create({
      sessionId: id,
      role,
      content,
      turnIndex
    });

    res.status(201).json({ success: true, data: turn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error adding turn' });
  }
};

export const completeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { finalReport, urgencyScore, recommendedSpecialty } = req.body;

    const session = await SymptomSession.findOneAndUpdate(
      { _id: id, userId },
      { 
        $set: {
          status: SessionStatus.Completed,
          finalReport,
          urgencyScore,
          recommendedSpecialty
        }
      },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error completing session' });
  }
};
