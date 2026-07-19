import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireDoctor } from '../middleware/doctor.middleware';
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentsByDoctor,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  linkDoctorProfile
} from '../controllers/appointments.controller';

const router = Router();

// All appointment routes require authentication
router.use(requireAuth);

router.post('/', bookAppointment);
router.get('/', getMyAppointments);
router.get('/doctor/:doctorId', getAppointmentsByDoctor);
router.get('/doctor-dashboard', requireDoctor, getDoctorAppointments);
router.patch('/link-profile', requireDoctor, linkDoctorProfile);
router.patch('/:id/status', requireDoctor, updateAppointmentStatus);
router.delete('/:id', cancelAppointment);

export default router;
