import type { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import path from 'path';

if (!getApps().length) {
  initializeApp({
    credential: cert(path.resolve(process.cwd(), 'firebase-service-account.json')),
  });
}

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
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}