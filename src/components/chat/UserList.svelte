<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
  import type { ChatUser } from '$lib/types/chat';
  import { Search, Filter } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import iso3166 from 'iso-3166-1-alpha-2';

  export let currentUserId: string;
  export let onUserSelect: (user: ChatUser) => void;

  let users: ChatUser[] = [];
  let loading = true;
  let searchQuery = '';
  let lastActiveInterval: number;
  let showFilters = false;
  let filters = {
    gender: [] as string[],
    ageRange: { min: 18, max: 80 },
    countries: [] as string[]
  };

  $: filterActive = filters.gender.length || filters.countries.length || filters.ageRange.min !== 18 || filters.ageRange.max !== 80;

  const countries = Object.entries(iso3166.getCountries())
    .map(([code, name]) => ({ code: code.toLowerCase(), name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  function isUserOnline(lastActive: string): boolean {
    const lastActiveTime = new Date(lastActive).getTime();
    return Date.now() - lastActiveTime <= 60000;
  }

  function arrangeUsers(users: ChatUser[]) {
    return [...users].sort((a, b) => {
      if (a.isAdmin) return -1;
      if (b.isAdmin) return 1;
      if (a.isVip && b.isVip) {
        const aTime = a.vipSince ? new Date(a.vipSince).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.vipSince ? new Date(b.vipSince).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return aTime - bTime;
      }
      if (a.isVip && !b.isVip) return -1;
      if (!a.isVip && b.isVip) return 1;
      const countryCompare = a.country?.localeCompare(b.country || '') || 0;
      if (countryCompare !== 0) return countryCompare;
      return (a.nickname || '').localeCompare(b.nickname || '');
    });
  }

  $: filteredUsers = arrangeUsers(
    users.filter(user => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !(
            user.nickname?.toLowerCase().includes(searchLower) ||
            user.country?.toLowerCase().includes(searchLower) ||
            (user.interests && user.interests.some(i => i.toLowerCase().includes(searchLower)))
          )
        ) return false;
      }
      if (filters.gender.length && !filters.gender.includes(user.gender)) return false;
      if (user.age < filters.ageRange.min || user.age > filters.ageRange.max) return false;
      if (filters.countries.length && !filters.countries.includes(user.country)) return false;
      return true;
    })
  );

  $: onlineCount = users.filter(user => isUserOnline(user.lastActive)).length;

  async function handleBlock(user: ChatUser) {
    try {
      const currentUserRef = doc(firestore, 'profiles', currentUserId);
      const targetUserRef = doc(firestore, 'profiles', user.uid);
      await Promise.all([
        updateDoc(currentUserRef, { blockedUsers: arrayUnion(user.uid) }),
        updateDoc(targetUserRef, { blockedUsers: arrayUnion(currentUserId) })
      ]);
      toast.success(`Blocked ${user.nickname}`);
    } catch (error) {
      toast.error('Failed to block user');
    }
  }

  async function handleUnblock(user: ChatUser) {
    try {
      const currentUserRef = doc(firestore, 'profiles', currentUserId);
      const targetUserRef = doc(firestore, 'profiles', user.uid);
      await Promise.all([
        updateDoc(currentUserRef, { blockedUsers: arrayRemove(user.uid) }),
        updateDoc(targetUserRef, { blockedUsers: arrayRemove(currentUserId) })
      ]);
      toast.success(`Unblocked ${user.nickname}`);
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  }

  function clearFilters() {
    filters = {
      gender: [],
      ageRange: { min: 18, max: 80 },
      countries: []
    };
  }

  function toggleGenderFilter(gender: string) {
    filters.gender = filters.gender.includes(gender)
      ? filters.gender.filter(g => g !== gender)
      : [...filters.gender, gender];
  }

  function toggleCountryFilter(country: string) {
    const currentUser = users.find(u => u.uid === currentUserId);
    const maxCountries = currentUser?.isVip ? 5 : 2;
    if (filters.countries.includes(country)) {
      filters.countries = filters.countries.filter(c => c !== country);
    } else if (filters.countries.length < maxCountries) {
      filters.countries = [...filters.countries, country];
    } else {
      toast.error(`Maximum ${maxCountries} countries allowed`);
    }
  }

  onMount(() => {
    const q = query(
      collection(firestore, 'profiles'),
      where('uid', '!=', currentUserId),
      orderBy('uid')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      users = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as ChatUser[];
      loading = false;
    });
    lastActiveInterval = window.setInterval(() => {
      const userRef = doc(firestore, 'profiles', currentUserId);
      updateDoc(userRef, { lastActive: new Date().toISOString() });
    }, 30000);
    return () => {
      unsubscribe();
      if (lastActiveInterval) clearInterval(lastActiveInterval);
    };
  });

  onDestroy(() => {
    if (lastActiveInterval) clearInterval(lastActiveInterval);
  });

  function genderColor(gender: string) {
    if (gender?.toLowerCase() === 'male') return 'text-blue-600';
    if (gender?.toLowerCase() === 'female') return 'text-pink-500';
    return 'text-gray-700';
  }
</script>

<style>
  /* --- VIP SHIMMERING BORDER --- */
  .vip-card {
    position: relative;
    z-index: 1;
    overflow: visible;
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 6px 0 #fbe19711;
  }
  .vip-border-anim {
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    z-index: 2;
    padding: 2px;
    background: linear-gradient(120deg,
      #ffe066 10%, #fff9d6 40%, #fff 50%, #ffe066 60%, #ffd700 90%
    );
    background-size: 200% 200%;
    animation: shimmer-gold 2.5s linear infinite;
    /* Use a mask to only show border! */
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  @keyframes shimmer-gold {
    0%   { background-position: 100% 0; }
    100% { background-position: 0 100%; }
  }
  /* Crown */
  .vip-crown {
    position: absolute;
    left: 50%;
    top: -17px; /* closer to avatar edge */
    transform: translateX(-50%);
    z-index: 3;
    font-size: 1.35rem;
    line-height: 1;
    filter: drop-shadow(0 2px 5px #ffe066aa);
    background: none;
    pointer-events: none;
  }
  /* Avatar centered */
  .user-avatar-holder {
    position: relative;
    z-index: 2;
    margin-top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

<div class="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
  <!-- Search & Filter Bar -->
  <div class="p-4 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <input
          type="text"
          placeholder="Search users..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500 text-base"
        />
        <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>
      <button
        class="ml-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900 transition-all relative"
        class:ring-2={filterActive}
        class:ring-primary-500={filterActive}
        title="Filter users"
        on:click={() => showFilters = !showFilters}
      >
        <Filter size={20} />
        {#if filterActive}
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full border-2 border-white dark:border-gray-800"></span>
        {/if}
      </button>
    </div>
    {#if showFilters}
      <div
        class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
        use:clickOutside={() => showFilters = false}
      >
        <!-- Gender -->
        <div class="mb-3">
          <div class="font-medium mb-1">Gender</div>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 rounded-full text-sm font-medium transition
                {filters.gender.includes('Male')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}"
              on:click={() => toggleGenderFilter('Male')}
            >Male</button>
            <button
              class="px-3 py-1 rounded-full text-sm font-medium transition
                {filters.gender.includes('Female')
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}"
              on:click={() => toggleGenderFilter('Female')}
            >Female</button>
          </div>
        </div>
        <!-- Age -->
        <div class="mb-3">
          <div class="font-medium mb-1">Age Range</div>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={filters.ageRange.min}
              min="18" max="{filters.ageRange.max}"
              class="flex-1"
            />
            <span class="text-sm">{filters.ageRange.min}</span>
            <span class="mx-1">–</span>
            <input
              type="range"
              bind:value={filters.ageRange.max}
              min="{filters.ageRange.min}" max="80"
              class="flex-1"
            />
            <span class="text-sm">{filters.ageRange.max}</span>
          </div>
        </div>
        <!-- Country -->
        <div class="mb-3">
          <div class="font-medium mb-1">Country</div>
          <div class="h-36 overflow-y-auto">
            {#each countries as country}
              <button
                class="w-full px-2 py-1 flex items-center gap-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                  {filters.countries.includes(country.name) ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' : ''}"
                on:click={() => toggleCountryFilter(country.name)}
              >
                <img src={"https://flagcdn.com/" + country.code + ".svg"} alt={country.name + " flag"} class="w-4 h-3 object-cover rounded" />
                <span class="text-sm">{country.name}</span>
              </button>
            {/each}
          </div>
        </div>
        <button
          class="mt-2 w-full py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
          on:click={clearFilters}
        >Clear Filters</button>
      </div>
    {/if}
  </div>

  <!-- Online Users Count -->
  <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
    <span class="text-sm font-medium">People</span>
    <span class="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full">{onlineCount} online</span>
  </div>
  
  <!-- User List -->
  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex justify-center items-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    {:else if filteredUsers.length === 0}
      <div class="p-4 text-center text-gray-500 dark:text-gray-400">No users found</div>
    {:else}
      {#each filteredUsers as user}
        {@const currentUser = users.find(u => u.uid === currentUserId)}
        {@const isBlocked = currentUser?.blockedUsers?.includes(user.uid)}

        <div class="relative py-5 px-2 border-b border-gray-100 dark:border-gray-700 transition-colors
                    bg-white dark:bg-gray-800 group
                    {user.isVip ? 'vip-card' : ''}
                    {isBlocked ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}">

          {#if user.isVip}
            <span class="vip-border-anim"></span>
          {/if}

          <button
            class="w-full flex items-center gap-4 text-left relative bg-transparent"
            on:click={() => !isBlocked && onUserSelect(user)}
            disabled={isBlocked}
            style="outline: none;"
          >
            <div class="user-avatar-holder relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              {#if user.isVip}
                <span class="vip-crown">👑</span>
              {/if}
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg font-semibold z-10 relative">
                {user.nickname[0].toUpperCase()}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <span class="block text-[15px] font-medium truncate">{user.nickname}</span>
              <span class="block text-xs mt-0.5 truncate">
                <span class={genderColor(user.gender)}>{user.gender}</span>, {user.age}
                <span class="inline-block mx-1">|</span>
                <img src={`https://flagcdn.com/${user.countryCode}.svg`} alt={user.country} class="inline w-4 h-3 object-cover rounded" />
                <span class="ml-1">{user.country}</span>
              </span>
              {#if user.interests?.length}
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each user.interests as interest}
                    <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                      {interest}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>
