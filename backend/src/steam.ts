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

export async function searchSteamGames(query: string): Promise<SteamSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`
    );
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Error in searchSteamGames:', error);
    return [];
  }
}

export async function fetchGameDetails(appId: number): Promise<GameDetails | null> {
  // Return early if the appId is missing or Not a Number
  if (!appId || Number.isNaN(appId)) {
    console.error('Invalid appId passed to fetchGameDetails:', appId);
    return null;
  }

  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    const data = await res.json();

    // Check if data exists and contains the key
    if (!data || !data[appId] || !data[appId].success) return null;

    const game = data[appId].data;

    return {
      id: appId,
      title: game.name,
      icon: game.header_image,
      shortDescription: game.short_description || '',
      synopsis: game.detailed_description || '',
      releaseDate: game.release_date?.date || 'TBA',
      genres: game.genres ? game.genres.map((g: { description: string }) => g.description) : [],
    };
  } catch (error) {
    console.error(`Error in fetchGameDetails for ${appId}:`, error);
    return null;
  }
}
export interface FeaturedSections {
  popular: SteamSearchResult[];
  topSellers: SteamSearchResult[];
  newReleases: SteamSearchResult[];
}

export async function fetchFeaturedGames(): Promise<FeaturedSections> {
  try {
    // Helper function to query Steam store search with explicit parameters
    const fetchSection = async (params: string, categoryName: string): Promise<SteamSearchResult[]> => {
      const res = await fetch(`https://store.steampowered.com/api/storesearch/?${params}&cc=US&l=english`);
      const data = await res.json();
      
      const items = (data.items || []).slice(0, 10).map((item: any) => ({
        id: item.id,
        name: item.name,
        tiny_image: item.tiny_image || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
      }));

      console.log(`\n=== [Steam API] Category: ${categoryName} (${items.length} items) ===`);
      items.forEach((game: SteamSearchResult, idx: number) => {
        console.log(`  ${idx + 1}. [ID: ${game.id}] ${game.name}`);
      });

      return items;
    };

    // 1. Popular / Featured
    const resFeatured = await fetch('https://store.steampowered.com/api/featured/?cc=US&l=english');
    const dataFeatured = await resFeatured.json();
    const rawPopular = dataFeatured.featured_win || [];
    const popular: SteamSearchResult[] = rawPopular.slice(0, 10).map((item: any) => ({
      id: item.id,
      name: item.name,
      tiny_image: item.large_capsule_image || item.header_image,
    }));

    console.log(`\n=== [Steam API] Category: Popular Right Now (${popular.length} items) ===`);
    popular.forEach((game: SteamSearchResult, idx: number) => {
      console.log(`  ${idx + 1}. [ID: ${game.id}] ${game.name}`);
    });

    // 2. Top Sellers
    const topSellers = await fetchSection('term=game&sort_by=released_DESC', 'Top Sellers');

    // 3. New Releases
    const newReleases = await fetchSection('term=2026&sort_by=released_DESC', 'New & Trending');

    return { popular, topSellers, newReleases };
  } catch (error) {
    console.error('Error fetching featured Steam games:', error);
    return { popular: [], topSellers: [], newReleases: [] };
  }
}