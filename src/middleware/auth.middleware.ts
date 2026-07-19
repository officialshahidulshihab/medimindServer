import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Attach user information to request object for downstream usage
    (req as any).user = session.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
