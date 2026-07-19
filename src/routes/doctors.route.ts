import { Router } from 'express';
import { getDoctors, getDoctorById, createDoctor, deleteDoctor, selfRegisterDoctor, getMyDoctorProfile } from '../controllers/doctors.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { requireDoctor } from '../middleware/doctor.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDoctors);
router.get('/my-profile', requireAuth, requireDoctor, getMyDoctorProfile);
router.post('/self-register', requireAuth, requireDoctor, selfRegisterDoctor);
router.get('/:id', getDoctorById);

// Protected Routes
router.post('/', requireAdmin, createDoctor);
router.delete('/:id', requireAdmin, deleteDoctor);

export default router;
