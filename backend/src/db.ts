import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing from environment variables!');
    return;
  }

  if (!cachedPromise) {
    console.log('Attempting to connect to MongoDB Atlas...');
    cachedPromise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, 
    });
  }

  try {
    await cachedPromise;
    console.log('MongoDB Atlas Connected Successfully');
  } catch (error) {
    cachedPromise = null;
    console.error('MongoDB Connection Failed:', error);
  }
}