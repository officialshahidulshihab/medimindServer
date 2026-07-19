import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/health-documents.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.delete('/:id', deleteDocument);

export default router;
