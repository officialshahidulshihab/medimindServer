import mongoose, { Schema, Document } from 'mongoose';

export enum RiskLevel {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high',
  Severe = 'severe',
}

export interface IDrugCheck extends Document {
  userId: string;
  medications: string[];
  interactionMatrix?: any; // Mixed object
  dangerFlags: string[];
  overallRiskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
}

const drugCheckSchema = new Schema<IDrugCheck>(
  {
    userId: { type: String, ref: 'User', required: true },
    medications: [{ type: String, required: true }],
    interactionMatrix: { type: Schema.Types.Mixed },
    dangerFlags: [{ type: String }],
    overallRiskLevel: { 
      type: String, 
      enum: Object.values(RiskLevel),
      required: true 
    },
  },
  {
    timestamps: true,
  }
);

export const DrugCheck = mongoose.models.DrugCheck || mongoose.model<IDrugCheck>('DrugCheck', drugCheckSchema);
