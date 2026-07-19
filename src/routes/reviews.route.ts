import { Router } from 'express';
import { createReview, getDoctorReviews, deleteReview } from '../controllers/reviews.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/doctor/:doctorId', getDoctorReviews);

// Protected Routes
router.post('/', requireAuth, createReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
