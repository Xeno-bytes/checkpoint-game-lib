import { Router } from 'express';
import { User } from '../models/User.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/users/me -> Check if logged-in user exists in MongoDB
router.get('/me', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing from token' });
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ exists: false, message: 'User profile not set up yet' });
    }

    res.json({ exists: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/setup -> Create MongoDB profile with a unique nickname
router.post('/setup', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing from token' });
    }

    const email = req.user?.email || '';
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 3) {
      return res.status(400).json({ error: 'Nickname must be at least 3 characters long' });
    }

    const cleanNickname = nickname.trim().toLowerCase();

    // Check for duplicate nickname
    const existingNickname = await User.findOne({ nickname: cleanNickname });
    if (existingNickname) {
      return res.status(400).json({ error: 'Nickname is already taken. Choose another one.' });
    }

    const newUser = await User.create({
      firebaseUid: uid,
      email,
      nickname: cleanNickname,
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

export default router;