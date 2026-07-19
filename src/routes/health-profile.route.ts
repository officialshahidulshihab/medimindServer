import { Router } from 'express';
import { getHealthProfile, upsertHealthProfile } from '../controllers/health-profile.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getHealthProfile);
router.post('/', upsertHealthProfile);

export default router;
