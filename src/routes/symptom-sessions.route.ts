import { Router } from 'express';
import { 
  createSession, 
  getSessions, 
  getSessionById, 
  addSessionTurn, 
  completeSession 
} from '../controllers/symptom-sessions.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.post('/:id/turns', addSessionTurn);
router.patch('/:id/complete', completeSession);

export default router;
