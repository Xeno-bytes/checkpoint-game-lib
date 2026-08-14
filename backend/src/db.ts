import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'devuser',
  password: process.env.DB_PASSWORD || 'devpassword',
  database: process.env.DB_NAME || 'spine_db',
  port: Number(process.env.DB_PORT) || 5432,
});