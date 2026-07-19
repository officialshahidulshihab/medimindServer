import mongoose, { Schema, Document } from 'mongoose';

export enum ConsultationMode {
  InPerson = 'In-person',
  Video = 'Video',
  Both = 'Both',
}

export interface IDoctor extends Document {
  name: string;
  specialty: string;
  subSpecialties: string[];
  location: string;
  consultationMode: ConsultationMode;
  rating: number;
  reviewCount: number;
  verified: boolean;
  imageUrl?: string;
  createdBy?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    subSpecialties: [{ type: String }],
    location: { type: String, required: true },
    consultationMode: { 
      type: String, 
      enum: Object.values(ConsultationMode), 
      default: ConsultationMode.InPerson 
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    imageUrl: { type: String },
    createdBy: { type: String, ref: 'User' },
    userId: { type: String, ref: 'User', unique: true, sparse: true },
  },
  {
    timestamps: true,
  }
);

export const Doctor = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', doctorSchema);
