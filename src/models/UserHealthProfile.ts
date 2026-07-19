import mongoose, { Schema, Document } from 'mongoose';

export interface IUserHealthProfile extends Document {
  userId: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userHealthProfileSchema = new Schema<IUserHealthProfile>(
  {
    userId: { type: String, ref: 'User', required: true, unique: true },
    age: { type: Number },
    gender: { type: String },
    bloodType: { type: String },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const UserHealthProfile = mongoose.models.UserHealthProfile || mongoose.model<IUserHealthProfile>('UserHealthProfile', userHealthProfileSchema);
