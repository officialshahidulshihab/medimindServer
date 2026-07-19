import { Router } from 'express';
import { getDoctors, getDoctorById, createDoctor, deleteDoctor, selfRegisterDoctor, getMyDoctorProfile } from '../controllers/doctors.controller.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { requireDoctor } from '../middleware/doctor.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getDoctors);
router.get('/my-profile', requireAuth, requireDoctor, getMyDoctorProfile);
router.post('/self-register', requireAuth, requireDoctor, selfRegisterDoctor);
router.get('/:id', getDoctorById);

// Protected Routes
router.post('/', requireAdmin, createDoctor);
router.delete('/:id', requireAdmin, deleteDoctor);

export default router;
