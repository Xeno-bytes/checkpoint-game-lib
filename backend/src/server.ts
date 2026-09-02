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
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');

      // Drop legacy index on 'nickname' if it still exists in MongoDB
      mongoose.connection.collection('users').dropIndex('nickname_1')
        .then(() => console.log('🗑️ Dropped stale nickname_1 index'))
        .catch(() => {
          // Safe to ignore if index was already removed
        });
    })
    .catch((err) => console.error('MongoDB connection error:', err));
}

// --- USER & AUTH ROUTES ---

// GET /api/users/me -> Fetch logged-in user profile
app.get('/api/users/me', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    const user = await User.findOne({ firebaseUid });
    
    if (!user || !user.username) {
      return res.status(404).json({ error: 'User profile incomplete' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Shared handler for setup and profile updating
const handleSaveProfile = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: Missing UID' });
    }

    // Support both 'nickname' and 'username' from request body
    const rawName = req.body.nickname || req.body.username;
    if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const trimmedUsername = rawName.trim().toLowerCase();

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser && existingUser.firebaseUid !== firebaseUid) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create or update the user document in MongoDB
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        firebaseUid, 
        email: req.user?.email || '', 
        username: trimmedUsername 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(user);
  } catch (err: any) {
    console.error('❌ Server Profile Save Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save profile' });
  }
};

// POST /api/users/setup & POST /api/users/profile
app.post('/api/users/setup', verifyFirebaseToken, handleSaveProfile);
app.post('/api/users/profile', verifyFirebaseToken, handleSaveProfile);

// GET /api/users/profile/:username -> Fetch public user profile and their library
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const rawUsername = req.params.username.trim();
    
    // Case-insensitive match on username
    const user = await User.findOne({
      username: new RegExp(`^${rawUsername}$`, 'i')
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch library items belonging to this user
    const libraryItems = await LibraryItem.find({ userId: user._id }).sort({ updatedAt: -1 });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      },
      library: libraryItems,
    });
  } catch (err) {
    console.error('Failed to fetch public profile:', err);
    res.status(500).json({ error: 'Failed to fetch public library' });
  }
});

// --- GAMES ROUTES ---

app.get('/api/games/featured', async (_req, res) => {
  try {
    const featured = await fetchFeaturedGames();
    res.json(featured);
  } catch (err) {
    console.error('Failed to fetch featured games:', err);
    res.status(500).json({ error: 'Failed to fetch featured games' });
  }
});

app.get('/api/games/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const gamesOnly = req.query.gamesOnly !== 'false'; // Default to true

    if (!query.trim()) {
      return res.json([]);
    }

    const results = await searchSteamGames(query, gamesOnly);
    res.json(results);
  } catch (err) {
    console.error('Failed to search Steam games:', err);
    res.status(500).json({ error: 'Failed to search games' });
  }
});

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