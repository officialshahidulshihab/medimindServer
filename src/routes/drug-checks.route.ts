import { Router } from 'express';
import { saveDrugCheck, getDrugChecks } from '../controllers/drug-checks.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', saveDrugCheck);
router.get('/', getDrugChecks);

export default router;
