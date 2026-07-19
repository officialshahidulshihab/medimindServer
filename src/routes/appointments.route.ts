import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireDoctor } from '../middleware/doctor.middleware.js';
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentsByDoctor,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  linkDoctorProfile
} from '../controllers/appointments.controller.js';

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
