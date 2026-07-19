import { Router } from 'express';
import { deleteMe } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.delete('/me', requireAuth, deleteMe);

export default router;
