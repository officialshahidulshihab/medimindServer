import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import mongoose from 'mongoose';

export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { doctorId, appointmentDate, timeSlot, consultationType, reason, notes } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !consultationType || !reason) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }

    const duplicate = await Appointment.findOne({
      patientId: userId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot
    });

    if (duplicate) {
      res.status(409).json({ success: false, message: 'You already have an appointment booked for this slot' });
      return;
    }

    const appointment = await Appointment.create({
      patientId: userId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      consultationType,
      reason,
      notes
    });

    res.status(201).json({ success: true, data: appointment, message: 'Appointment booked successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error booking appointment' });
  }
};

export const getMyAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const appointments = await Appointment.find({ patientId: userId })
      .sort({ appointmentDate: -1 })
      .populate('doctorId', 'name specialty location imageUrl consultationMode');
    
    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching appointments' });
  }
};

export const getAppointmentsByDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const query: any = { doctorId };
    
    if (date) {
      const queryDate = new Date(date as string);
      // Start and end of the day
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query).select('timeSlot status');
    
    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching doctor appointments' });
  }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const appointment = await Appointment.findOne({ _id: id, patientId: userId });
    
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
      return;
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({ success: true, data: appointment, message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error cancelling appointment' });
  }
};

// GET /api/appointments/doctor-dashboard
// Doctor sees all appointments for their linked Doctor document
export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Find the Doctor document linked to this user account
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({ success: false, message: 'No doctor profile linked to this account' });
      return;
    }

    const { status, date } = req.query;
    const query: any = { doctorId: doctor._id };

    if (status) query.status = status;
    if (date) {
      const queryDate = new Date(date as string);
      query.appointmentDate = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lte: new Date(queryDate.setHours(23, 59, 59, 999))
      };
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1 })
      .populate('patientId', 'name email image');

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching appointments' });
  }
};

// PATCH /api/appointments/:id/status
// Doctor confirms or cancels an appointment
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be confirmed or cancelled' });
      return;
    }

    // Verify this appointment belongs to the doctor's linked Doctor document
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(403).json({ success: false, message: 'No doctor profile linked to this account' });
      return;
    }

    const appointment = await Appointment.findOne({ _id: id, doctorId: doctor._id });
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
      return;
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({ success: true, data: appointment, message: `Appointment ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating appointment status' });
  }
};

export const linkDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { doctorId } = req.body;

    // Check not already linked
    const alreadyLinked = await Doctor.findOne({ userId });
    if (alreadyLinked) {
      res.status(409).json({ success: false, message: 'Your account is already linked to a doctor profile' });
      return;
    }

    // Check target doctor not already linked to someone else
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }
    if (doctor.userId) {
      res.status(409).json({ success: false, message: 'This doctor profile is already claimed' });
      return;
    }

    doctor.userId = new mongoose.Types.ObjectId(userId);
    await doctor.save();

    res.status(200).json({ success: true, data: doctor, message: 'Profile linked successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error linking profile' });
  }
};
