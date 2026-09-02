const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

export interface GameDetails {
  id: number;
  title: string;
  icon: string;
  shortDescription: string;
  synopsis: string;
  releaseDate: string;
  genres: string[];
}

export async function fetchGameDetails(steamId: number): Promise<GameDetails> {
  const res = await fetch(`${BACKEND_URL}/games/${steamId}`);
  if (!res.ok) throw new Error('Failed to fetch game details from backend');
  return res.json();
}

export async function saveLibraryItem(payload: any, token?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}/library`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to save game');
  return res.json();
}

export async function deleteLibraryItem(id: number, token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}/library/${id}`, { 
    method: 'DELETE',
    headers 
  });
  return res.json();
}

export async function searchGames(query: string, gamesOnly = true) {
  const url = `${BACKEND_URL}/games/search?q=${encodeURIComponent(query)}&gamesOnly=${gamesOnly}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search games');
  return res.json();
}

export async function fetchLibrary(token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}/library`, { headers });
  if (!res.ok) throw new Error('Failed to fetch library data');
  return res.json();
}

export async function fetchFeaturedGames() {
  const res = await fetch(`${BACKEND_URL}/games/featured`);
  if (!res.ok) throw new Error('Failed to fetch featured games');
  return res.json();
}

export async function fetchPublicLibrary(username: string) {
  const res = await fetch(`${BACKEND_URL}/users/profile/${encodeURIComponent(username)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    throw new Error('Failed to fetch public library data');
  }
  return res.json();
}