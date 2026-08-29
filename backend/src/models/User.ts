import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  nickname: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nickname: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', UserSchema);