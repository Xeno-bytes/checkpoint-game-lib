export interface SteamGame {
  id: number;
  name: string;
  tiny_image?: string;
  header_image?: string;
}

export interface LibraryItem {
  id?: number;
  steam_id: number;
  name: string;
  background_image: string;
  status: 'Backlog' | 'In Progress' | 'On Hold' | 'Completed';
  rating?: number;
  hoursPlayed?: number | null;
  notes?: string;
  created_at?: string;
}

export interface GameDetails {
  id: number;
  title: string;
  icon: string;
  shortDescription: string;
  synopsis: string;
  releaseDate: string;
  genres: string[];
}