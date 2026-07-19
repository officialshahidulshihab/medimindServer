import { Request, Response, NextFunction } from 'express';


export const requireDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionUser = (req as any).user;
    if (!sessionUser) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // First check session role
    if (sessionUser.role === 'doctor' || sessionUser.role === 'admin') {
      next();
      return;
    }

    // Fallback: check role directly from DB using User model (User schema has _id: String)
    const { User } = await import('../models/User');
    const dbUser = await User.findById(sessionUser.id).select('role').lean();
    if (dbUser && ((dbUser as any).role === 'doctor' || (dbUser as any).role === 'admin')) {
      (req as any).user.role = (dbUser as any).role;
      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Doctor access required' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization error' });
  }
};
