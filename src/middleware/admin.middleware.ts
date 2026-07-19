import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session?.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = session.user as any;

    if (user.role === 'admin') {
      (req as any).user = { id: user.id, email: user.email, role: user.role };
      next();
      return;
    }

    const { User } = await import('../models/User.js');
    const dbUser = await (User.findById as Function)(user.id).select('role').lean();
    if (dbUser && (dbUser as any).role === 'admin') {
      (req as any).user = { id: user.id, email: user.email, role: (dbUser as any).role };
      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};