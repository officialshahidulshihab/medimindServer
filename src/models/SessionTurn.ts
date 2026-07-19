import mongoose, { Schema, Document } from 'mongoose';

export enum Role {
  User = 'user',
  Assistant = 'assistant',
}

export interface ISessionTurn extends Document {
  sessionId: mongoose.Types.ObjectId;
  role: Role;
  content: string;
  turnIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const sessionTurnSchema = new Schema<ISessionTurn>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'SymptomSession', required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    content: { type: String, required: true },
    turnIndex: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Optimize querying turns sequentially by session
sessionTurnSchema.index({ sessionId: 1, turnIndex: 1 });

export const SessionTurn = mongoose.models.SessionTurn || mongoose.model<ISessionTurn>('SessionTurn', sessionTurnSchema);
