import { Router } from 'express';
import { handleSymptomChat, analyzeDocument, checkDrugs } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/symptom-chat', handleSymptomChat);
router.post('/analyze-document', analyzeDocument);
router.post('/check-drugs', checkDrugs);

export default router;
