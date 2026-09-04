import type { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

function initFirebase() {
  if (getApps().length > 0) return;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized via environment variable');
      return;
    }

    const localKeyPath = path.resolve(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(localKeyPath)) {
      initializeApp({
        credential: cert(localKeyPath),
      });
      console.log('✅ Firebase Admin initialized via local JSON file');
      return;
    }

    console.warn('⚠️ No Firebase Admin credentials found. Auth routes will fail.');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:', err);
  }
}

initFirebase();

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Token payload is empty' });
  }

  try {
    if (getApps().length === 0) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}