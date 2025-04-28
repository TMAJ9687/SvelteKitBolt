import { writable } from 'svelte/store';

export interface UserProfile {
  uid: string;
  nickname: string;
  gender: string;
  age: number;
  country: string;
  interests: string[];
  createdAt: string;
}

interface AuthStore {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const authStore = writable<AuthStore>({
  user: null,
  loading: true,
  error: null
});

export function updateAuthStore(user: UserProfile | null, error: string | null = null) {
  authStore.update(state => ({
    ...state,
    user,
    error,
    loading: false
  }));
}