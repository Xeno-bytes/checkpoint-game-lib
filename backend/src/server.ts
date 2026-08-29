import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { searchSteamGames, fetchGameDetails, fetchFeaturedGames } from './steam.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/users', userRoutes);

let libraryStore: any[] = [];

// TEST ROUTE
app.get('/api/test-db', async (req, res) => {
  try {
    await connectDB();
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      success: isConnected,
      message: isConnected ? 'Connected to MongoDB Atlas!' : 'Database disconnected',
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// --- LIBRARY ROUTES ---
app.get('/api/library', (req, res) => {
  res.json(libraryStore);
});

app.post('/api/library', (req, res) => {
  const item = req.body;
  const index = libraryStore.findIndex(i => Number(i.steam_id) === Number(item.steam_id));
  if (index !== -1) {
    libraryStore[index] = item;
  } else {
    libraryStore.push({ ...item, id: Date.now() });
  }
  res.json(item);
});

app.delete('/api/library/:id', (req, res) => {
  const id = Number(req.params.id);
  libraryStore = libraryStore.filter(i => i.id !== id);
  res.json({ success: true });
});

// --- GAME ROUTES ---
app.get('/api/games/featured', async (req, res) => {
  try {
    const featured = await fetchFeaturedGames();
    res.json(featured);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured games' });
  }
});

app.get('/api/games/search', async (req, res) => {
  const query = (req.query.q as string) || '';
  const results = await searchSteamGames(query);
  res.json(results);
});

app.get('/api/games/:id', async (req, res) => {
  const appId = Number(req.params.id);

  if (Number.isNaN(appId) || appId <= 0) {
    return res.status(400).json({ error: 'Invalid or missing Steam App ID' });
  }

  const details = await fetchGameDetails(appId);
  if (!details) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(details);
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});