import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { verifyFirebaseToken } from './middleware/auth.js';
import type { AuthenticatedRequest } from './middleware/auth.js';
import { User } from './models/User.js';
import { LibraryItem } from './models/LibraryItem.js';
import { fetchFeaturedGames, fetchGameDetails, searchSteamGames } from './steam.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());


// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfdb';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in backend/.env file!');
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- USER & AUTH ROUTES ---

// GET /api/users/me -> Fetch logged-in user profile
app.get('/api/users/me', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const user = await User.findOne({ firebaseUid });
    
    // If user document doesn't exist OR user has no username set yet
    if (!user || !user.username) {
      return res.status(404).json({ error: 'User profile incomplete' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/users/profile -> Create or update user profile
app.post('/api/users/profile', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const { username } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const trimmedUsername = username.trim();

    // Check if nickname is taken by another user
    const existingUsername = await User.findOne({ 
      username: trimmedUsername, 
      firebaseUid: { $ne: firebaseUid } 
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        firebaseUid, 
        email: req.user?.email || '', 
        username: trimmedUsername 
      },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// --- GAMES ROUTES ---
// GET /api/games/featured -> Public endpoint to fetch featured games from Steam
app.get('/api/games/featured', async (_req, res) => {
  try {
    const featured = await fetchFeaturedGames();
    res.json(featured);
  } catch (err) {
    console.error('Failed to fetch featured games:', err);
    res.status(500).json({ error: 'Failed to fetch featured games' });
  }
});

// GET /api/games/search?q=query -> Public endpoint to search Steam games
app.get('/api/games/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      return res.json([]);
    }

    const results = await searchSteamGames(query);
    res.json(results);
  } catch (err) {
    console.error('Failed to search Steam games:', err);
    res.status(500).json({ error: 'Failed to search games' });
  }
});

// GET /api/games/:id -> Public endpoint to fetch details for a single Steam game
app.get('/api/games/:id', async (req, res) => {
  try {
    const appId = Number(req.params.id);

    if (Number.isNaN(appId) || appId <= 0) {
      return res.status(400).json({ error: 'Invalid or missing Steam App ID' });
    }

    const details = await fetchGameDetails(appId);
    if (!details) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(details);
  } catch (err) {
    console.error(`Failed to fetch game details for ID ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// --- LIBRARY / SHELF ROUTES ---

// GET /api/library -> Fetch shelf items for logged-in user
app.get('/api/library', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.json([]);

    const libraryItems = await LibraryItem.find({ userId: user._id });
    res.json(libraryItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

// POST /api/library -> Save or update a game in user shelf
app.post('/api/library', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { steam_id, status, rating, hoursPlayed, notes } = req.body;

    // Map UI statuses to schema enum values
    const statusMap: Record<string, string> = {
      'In Progress': 'Playing',
      'Completed': 'Completed',
      'Backlog': 'Plan to Play',
      'On Hold': 'Dropped',
    };

    const mappedStatus = statusMap[status] || 'Plan to Play';

    const saved = await LibraryItem.findOneAndUpdate(
      { userId: user._id, appId: Number(steam_id) },
      {
        userId: user._id,
        appId: Number(steam_id),
        status: mappedStatus,
        rating: status === 'Completed' ? rating : null,
        playtimeHours: hoursPlayed || 0,
        reviewContent: notes || '',
      },
      { upsert: true, new: true }
    );

    res.json(saved);
  } catch (err) {
    console.error('Failed to save library item:', err);
    res.status(500).json({ error: 'Failed to save library item' });
  }
});

// DELETE /api/library/:id -> Delete shelf item
app.delete('/api/library/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing item ID' });
    }

    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await LibraryItem.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: user._id
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});