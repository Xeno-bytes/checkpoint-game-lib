import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LibraryItem } from '../types/game';
import { fetchLibrary } from '../api';
import { useAuthStore } from './auth';

export const useLibraryStore = defineStore('library', () => {
  const items = ref<any[]>([]);
  const loading = ref(false);
  const authStore = useAuthStore();

  async function loadLibrary(force = false) {
    if (!authStore.firebaseUser) {
      items.value = [];
      return;
    }

    if (items.value.length > 0 && !force) return;

    loading.value = true;
    try {
      const token = await authStore.getToken();
      items.value = await fetchLibrary(token);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      loading.value = false;
    }
  }

  function saveItemLocally(savedItem: any) {
    const targetAppId = Number(savedItem.appId || savedItem.steam_id || savedItem.steamId);

    // Normalize keys so mappedLibrary in LibraryView registers them correctly
    const normalizedItem = {
      ...savedItem,
      appId: targetAppId,
      steam_id: targetAppId,
      name: savedItem.name || savedItem.title || savedItem.gameName,
      title: savedItem.name || savedItem.title || savedItem.gameName,
      playtimeHours: savedItem.playtimeHours ?? savedItem.hoursPlayed ?? null,
      hoursPlayed: savedItem.playtimeHours ?? savedItem.hoursPlayed ?? null,
      notes: savedItem.reviewContent || savedItem.notes || '',
      reviewContent: savedItem.reviewContent || savedItem.notes || ''
    };

    const index = items.value.findIndex((i) => {
      const id = Number(i.appId || i.steam_id || i.steamId);
      return id === targetAppId;
    });

    if (index !== -1) {
      // Return a fresh array copy so Vue's reactivity system immediately fires updates
      const updatedList = [...items.value];
      updatedList[index] = { ...updatedList[index], ...normalizedItem };
      items.value = updatedList;
    } else {
      items.value = [normalizedItem, ...items.value];
    }
  }

  function removeItemLocally(itemIdOrAppId: string | number) {
    items.value = items.value.filter((i) => {
      const idMatches = String(i._id || i.id) === String(itemIdOrAppId);
      const appIdMatches = Number(i.appId || i.steam_id || i.steamId) === Number(itemIdOrAppId);
      return !idMatches && !appIdMatches;
    });
  }

  return {
    items,
    loading,
    loadLibrary,
    saveItemLocally,
    removeItemLocally,
  };
});