export interface RAWGGame {
  id: number;
  name: string;
  background_image?: string;
  rating?: number;
  released?: string;
  metacritic?: number;
  genres?: { id: number; name: string }[];
  platforms?: { platform: { id: number; name: string } }[];
  description_raw?: string;
}

export interface LibraryItem {
  id?: number;
  rawg_id: number | string;
  name: string;
  background_image?: string;
  status: 'Backlog' | 'In Progress' | 'Completed';
  rating: number;
  notes?: string;
  created_at?: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}