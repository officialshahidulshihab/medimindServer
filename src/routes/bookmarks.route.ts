import { Router } from 'express';
import { toggleBookmark, getUserBookmarks } from '../controllers/bookmarks.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/toggle', toggleBookmark);
router.get('/', getUserBookmarks);

export default router;
