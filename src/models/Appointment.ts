import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  patientId: string;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string;
  consultationType: string;
  reason: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: String, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    consultationType: { type: String, enum: ['In-person', 'Video'], required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema);
