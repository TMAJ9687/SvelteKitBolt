import { writable } from 'svelte/store';
import type { UserFilter } from '$lib/types/chat';

export const userFilters = writable<UserFilter>({
  gender: [],
  ageRange: {
    min: 18,
    max: 80
  },
  countries: [],
  isActive: true
});

export const hasActiveFilters = writable<boolean>(false);