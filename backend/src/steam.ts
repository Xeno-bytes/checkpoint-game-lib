export interface SteamSearchResult {
  id: number;
  name: string;
  tiny_image: string;
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

export interface FeaturedSections {
  relevanceSpotlight: SteamSearchResult[];
  featured: SteamSearchResult[];
  topSellers: SteamSearchResult[];
  newReleases: SteamSearchResult[];
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// FEATURED CACHE
let featuredCache: { data: FeaturedSections; timestamp: number } | null = null;
let featuredCachePromise: Promise<FeaturedSections> | null = null;

// GAME DETAILS CACHE
const gameDetailsCache = new Map<number, { data: GameDetails; timestamp: number }>();
const gameDetailsPromises = new Map<number, Promise<GameDetails | null>>();

// SEARCH CACHE
const searchCache = new Map<string, { data: SteamSearchResult[]; timestamp: number }>();

export async function searchSteamGames(query: string): Promise<SteamSearchResult[]> {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  const cached = searchCache.get(trimmedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(trimmedQuery)}&l=english&cc=US`
    );
    const data = await res.json();
    const results = (data.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      tiny_image: item.tiny_image || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`
    }));

    searchCache.set(trimmedQuery, { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error('Error in searchSteamGames:', error);
    return [];
  }
}

export async function fetchGameDetails(appId: number): Promise<GameDetails | null> {
  if (!appId || Number.isNaN(appId)) {
    console.error('Invalid appId passed to fetchGameDetails:', appId);
    return null;
  }

  const now = Date.now();

  const cached = gameDetailsCache.get(appId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (gameDetailsPromises.has(appId)) {
    return gameDetailsPromises.get(appId)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
      const data = await res.json();

      if (!data || !data[appId] || !data[appId].success) return null;

      const game = data[appId].data;
      const details: GameDetails = {
        id: appId,
        title: game.name,
        icon: game.header_image || game.capsule_image,
        shortDescription: game.short_description || '',
        synopsis: game.detailed_description || '',
        releaseDate: game.release_date?.date || 'TBA',
        genres: game.genres ? game.genres.map((g: { description: string }) => g.description) : [],
      };

      // Save to cache
      gameDetailsCache.set(appId, { data: details, timestamp: Date.now() });
      return details;
    } catch (error) {
      console.error(`Error in fetchGameDetails for ${appId}:`, error);
      return null;
    } finally {
      gameDetailsPromises.delete(appId);
    }
  })();

  gameDetailsPromises.set(appId, promise);
  return promise;
}

export async function fetchFeaturedGames(): Promise<FeaturedSections> {
  const now = Date.now();

  if (featuredCache && now - featuredCache.timestamp < CACHE_TTL_MS) {
    return featuredCache.data;
  }

  if (featuredCachePromise) {
    return featuredCachePromise;
  }

  featuredCachePromise = (async () => {
    try {
      const fetchStoreSection = async (extraParams: string, limit = 10): Promise<SteamSearchResult[]> => {
        const res = await fetch(`https://store.steampowered.com/api/storesearch/?${extraParams}&cc=US&l=english`);
        const data = await res.json();
        return (data.items || []).slice(0, limit).map((item: any) => ({
          id: item.id,
          name: item.name || `App ${item.id}`,
          tiny_image: item.tiny_image || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
        }));
      };

      const relevanceSpotlight = await fetchStoreSection('term=&sort_by=_ASC', 10);

      const resFeatured = await fetch('https://store.steampowered.com/api/featured/?cc=US&l=english');
      const dataFeatured = await resFeatured.json();
      const rawFeatured = dataFeatured.featured_win || [];
      const featured: SteamSearchResult[] = rawFeatured.slice(0, 10).map((item: any) => ({
        id: item.id,
        name: item.name || `App ${item.id}`,
        tiny_image: item.large_capsule_image || item.header_image || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
      }));

      const topSellers = await fetchStoreSection('term=game&sort_by=released_DESC', 10);
      const newReleases = await fetchStoreSection('term=2026&sort_by=released_DESC', 10);

      const result: FeaturedSections = { relevanceSpotlight, featured, topSellers, newReleases };

      featuredCache = { data: result, timestamp: Date.now() };
      return result;
    } catch (error) {
      console.error('Error fetching featured Steam games:', error);
      if (featuredCache) return featuredCache.data;
      return { relevanceSpotlight: [], featured: [], topSellers: [], newReleases: [] };
    } finally {
      featuredCachePromise = null;
    }
  })();

  return featuredCachePromise;
}