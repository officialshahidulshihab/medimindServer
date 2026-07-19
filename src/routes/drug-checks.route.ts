import { Router } from 'express';
import { saveDrugCheck, getDrugChecks } from '../controllers/drug-checks.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', saveDrugCheck);
router.get('/', getDrugChecks);

export default router;
