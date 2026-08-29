import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  username: string;
  createdAt?: Date;
}

const UserSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String, required: true, unique: true },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);