import { defineStore } from 'pinia';
import { ref } from 'vue';
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

    const existingIndex = items.value.findIndex((i) => {
        const id = Number(i.appId || i.steam_id || i.steamId);
        return id === targetAppId;
    });

    const existingItem = existingIndex !== -1 ? items.value[existingIndex] : {};

    const resolvedName = 
        savedItem.name || 
        savedItem.title || 
        savedItem.gameName || 
        existingItem.name || 
        existingItem.title || 
        existingItem.gameName;

    const normalizedItem = {
        ...existingItem,
        ...savedItem,
        appId: targetAppId,
        steam_id: targetAppId,
        steamId: targetAppId,
        name: resolvedName,
        title: resolvedName,
        gameName: resolvedName,
        rating: Number(savedItem.rating) || 0,
        playtimeHours: savedItem.playtimeHours ?? savedItem.hoursPlayed ?? null,
        hoursPlayed: savedItem.playtimeHours ?? savedItem.hoursPlayed ?? null,
        reviewContent: savedItem.reviewContent || savedItem.notes || '',
        notes: savedItem.reviewContent || savedItem.notes || ''
    };

    if (existingIndex !== -1) {
        const updatedList = [...items.value];
        updatedList[existingIndex] = normalizedItem;
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