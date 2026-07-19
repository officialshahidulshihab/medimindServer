import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document<string> {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal schema pointing to BetterAuth's 'user' collection
const userSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, required: true, default: false },
    image: { type: String },
    role: { type: String, default: 'patient' },
  },
  {
    timestamps: true,
    strict: false, // Allow BetterAuth to manage other fields freely
    collection: 'user', // BetterAuth default collection name
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
