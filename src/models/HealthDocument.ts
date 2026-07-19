import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthDocument extends Document {
  userId: string;
  type: string;
  fileUrl: string; // Cloudinary URL
  fileName: string;
  aiSummary?: string;
  extractedData?: any; // Mixed object
  abnormalFlags: string[];
  actionItems: string[];
  documentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const healthDocumentSchema = new Schema<IHealthDocument>(
  {
    userId: { type: String, ref: 'User', required: true },
    type: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    aiSummary: { type: String },
    extractedData: { type: Schema.Types.Mixed },
    abnormalFlags: [{ type: String }],
    actionItems: [{ type: String }],
    documentDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const HealthDocument = mongoose.models.HealthDocument || mongoose.model<IHealthDocument>('HealthDocument', healthDocumentSchema);
