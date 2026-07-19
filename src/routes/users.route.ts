import { Router } from 'express';
import { deleteMe } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.delete('/me', requireAuth, deleteMe);

export default router;
