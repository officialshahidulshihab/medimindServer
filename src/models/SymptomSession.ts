import mongoose, { Schema, Document } from 'mongoose';

export enum SessionStatus {
  Active = 'active',
  Completed = 'completed',
}

export interface ISymptomSession extends Document {
  userId: string;
  status: SessionStatus;
  initialSymptoms: string[];
  urgencyScore?: number;
  recommendedSpecialty?: string;
  finalReport?: any; // Mixed object
  createdAt: Date;
  updatedAt: Date;
}

const symptomSessionSchema = new Schema<ISymptomSession>(
  {
    userId: { type: String, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: Object.values(SessionStatus), 
      default: SessionStatus.Active 
    },
    initialSymptoms: [{ type: String }],
    urgencyScore: { type: Number },
    recommendedSpecialty: { type: String },
    finalReport: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const SymptomSession = mongoose.models.SymptomSession || mongoose.model<ISymptomSession>('SymptomSession', symptomSessionSchema);
