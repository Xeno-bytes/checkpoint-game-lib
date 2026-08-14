import type { RAWGGame, LibraryItem } from '../types/game';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const RAWG_BASE_URL = import.meta.env.VITE_RAWG_BASE_URL || 'https://api.rawg.io/api';
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000/api';

export async function fetchRawg<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  if (!RAWG_API_KEY) {
    console.warn('VITE_RAWG_API_KEY is missing in your .env file!');
  }

  const url = new URL(RAWG_BASE_URL + path);
  url.searchParams.set('key', RAWG_API_KEY);
  
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`RAWG request failed (${res.status})`);
  return res.json();
}

// --- BACKEND API ---
export async function fetchLibrary(): Promise<LibraryItem[]> {
  const res = await fetch(`${BACKEND_BASE_URL}/library`);
  if (!res.ok) throw new Error('Failed to load library');
  return res.json();
}

export async function saveLibraryItem(item: Partial<LibraryItem>): Promise<LibraryItem> {
  const isUpdate = Boolean(item.id);
  const url = isUpdate 
    ? `${BACKEND_BASE_URL}/library/${item.id}` 
    : `${BACKEND_BASE_URL}/library`;

  const res = await fetch(url, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to save game');
  return res.json();
}

export async function deleteLibraryItem(id: number): Promise<void> {
  const res = await fetch(`${BACKEND_BASE_URL}/library/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete game');
}