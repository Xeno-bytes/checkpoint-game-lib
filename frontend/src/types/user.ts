export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  nickname: string;
  createdAt: string;
}

export type GameStatus = 'Backlog' | 'In Progress' | 'On Hold' | 'Dropped' | 'Completed' | 'Endless';

export interface LibraryItem {
  id: string;
  userId: string;
  appId: number;
  status: GameStatus;
  playtimeHours: number;
  rating?: number;        
  reviewContent?: string; // Text review
  createdAt: string;
  updatedAt: string;
}

// Full hydrated object returned when viewing /library/:nickname
export interface PublicLibraryResponse {
  user: UserProfile;
  library: LibraryItem[];
  featuredReviews: LibraryItem[]; 
}