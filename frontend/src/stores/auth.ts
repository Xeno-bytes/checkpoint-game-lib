import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000/api';

export interface MongoUser {
  _id: string;
  firebaseUid: string;
  email: string;
  nickname: string;
}

export const useAuthStore = defineStore('auth', () => {
  const firebaseUser = ref<FirebaseUser | null>(null);
  const userProfile = ref<MongoUser | null>(null);
  const needsProfileSetup = ref<boolean>(false);
  const isLoading = ref<boolean>(true);

  // Helper to retrieve fresh JWT token for API requests
  async function getToken(): Promise<string | null> {
    if (!firebaseUser.value) return null;
    return await firebaseUser.value.getIdToken();
  }

  // Fetch Mongo profile from /api/users/me
  async function fetchUserProfile() {
    if (!firebaseUser.value) {
      userProfile.value = null;
      needsProfileSetup.value = false;
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 404) {
        userProfile.value = null;
        needsProfileSetup.value = true;
      } else if (res.ok) {
        const data = await res.json();
        const userData = data.user || data;
        userProfile.value = {
          ...userData,
          nickname: userData.username || userData.nickname
        };
        needsProfileSetup.value = false;
      } else {
        needsProfileSetup.value = false;
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      needsProfileSetup.value = false;
    }
  }

  // Trigger Google Login
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      firebaseUser.value = result.user;
      await fetchUserProfile();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Complete profile registration with chosen nickname
  async function setupProfile(nickname: string) {
    const token = await getToken();
    
    const res = await fetch(`${BACKEND_URL}/users/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ nickname })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create profile');
    }

    userProfile.value = {
      ...data,
      nickname: data.username || data.nickname
    };
    needsProfileSetup.value = false;
    return data;
  }

  // Logout
  async function logout() {
    await signOut(auth);
    firebaseUser.value = null;
    userProfile.value = null;
    needsProfileSetup.value = false;
  }

  // Auth Listener on App Boot
  function initAuth() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user;
        if (user) {
          await fetchUserProfile();
        } else {
          userProfile.value = null;
          needsProfileSetup.value = false;
        }
        isLoading.value = false;
        resolve();
      });
    });
  }

  return {
    firebaseUser,
    userProfile,
    needsProfileSetup,
    isLoading,
    getToken,
    loginWithGoogle,
    setupProfile,
    logout,
    initAuth
  };
});