import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing from your .env file!');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(uri);
    isConnected = mongoose.connection.readyState === 1;
    console.log('MongoDB Atlas Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Failed:', error);
  }
}