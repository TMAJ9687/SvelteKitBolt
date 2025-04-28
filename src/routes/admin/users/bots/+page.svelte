<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
  import { Search, Plus, Bot, FileEdit as Edit2, Trash2, X } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import iso3166 from 'iso-3166-1-alpha-2';
  import type { ChatUser } from '$lib/types/chat';

  let loading = true;
  let bots: ChatUser[] = [];
  let searchQuery = '';
  let showAddModal = false;
  let showEditModal = false;
  let selectedBot: ChatUser | null = null;
  let submitting = false;

  // Form data
  let formData = {
    nickname: '',
    gender: '',
    age: '',
    country: '',
    countryCode: '',
    interests: [] as string[],
    isActive: true
  };

  const interestOptions = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Technology',
    'Art', 'Books', 'Travel', 'Food', 'Fashion'
  ];

  const countries = Object.entries(iso3166.getCountries()).map(([code, name]) => ({
    code: code.toLowerCase(),
    name
  }));

  $: filteredBots = bots.filter(bot => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      bot.nickname.toLowerCase().includes(searchLower) ||
      bot.country.toLowerCase().includes(searchLower) ||
      bot.interests.some(i => i.toLowerCase().includes(searchLower))
    );
  });

  onMount(() => {
    const q = query(
      collection(firestore, 'profiles'),
      where('isBot', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      bots = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as ChatUser));
      loading = false;
    }, (error) => {
      console.error('Error fetching bots:', error);
      toast.error('Failed to load bots');
      loading = false;
    });

    return unsubscribe;
  });

  function resetForm() {
    formData = {
      nickname: '',
      gender: '',
      age: '',
      country: '',
      countryCode: '',
      interests: [],
      isActive: true
    };
  }

  function openEditModal(bot: ChatUser) {
    selectedBot = bot;
    formData = {
      nickname: bot.nickname,
      gender: bot.gender,
      age: bot.age.toString(),
      country: bot.country,
      countryCode: bot.countryCode,
      interests: [...bot.interests],
      isActive: !bot.inactive
    };
    showEditModal = true;
  }

  function handleCountryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const country = select.value;
    formData.country = country;
    formData.countryCode = iso3166.getCode(country)?.toLowerCase() || '';
  }

  function toggleInterest(interest: string) {
    if (formData.interests.includes(interest)) {
      formData.interests = formData.interests.filter(i => i !== interest);
    } else if (formData.interests.length < 3) {
      formData.interests = [...formData.interests, interest];
    } else {
      toast.error('Maximum 3 interests allowed');
    }
  }

  async function handleSubmit() {
    if (!formData.nickname || !formData.gender || !formData.age || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    submitting = true;

    try {
      const botData = {
        ...formData,
        age: parseInt(formData.age),
        isBot: true,
        isVip: true,
        lastActive: new Date().toISOString(),
        inactive: !formData.isActive
      };

      if (selectedBot) {
        // Update existing bot
        await updateDoc(doc(firestore, 'profiles', selectedBot.uid), botData);
        toast.success('Bot updated successfully');
      } else {
        // Create new bot
        const botRef = doc(collection(firestore, 'profiles'));
        await setDoc(botRef, {
          ...botData,
          uid: botRef.id,
          createdAt: new Date().toISOString()
        });
        toast.success('Bot created successfully');
      }

      showAddModal = false;
      showEditModal = false;
      selectedBot = null;
      resetForm();
    } catch (error) {
      console.error('Error saving bot:', error);
      toast.error('Failed to save bot');
    } finally {
      submitting = false;
    }
  }

  async function handleDelete(bot: ChatUser) {
    if (!confirm(`Are you sure you want to delete bot "${bot.nickname}"?`)) return;

    try {
      await deleteDoc(doc(firestore, 'profiles', bot.uid));
      toast.success('Bot deleted successfully');
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Failed to delete bot');
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold mb-2">Bot Management</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Manage chat bots and their configurations
      </p>
    </div>
    <button
      class="btn btn-primary flex items-center gap-2"
      on:click={() => { resetForm(); showAddModal = true; }}
    >
      <Plus size={20} />
      Add Bot
    </button>
  </div>

  <div class="card">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <input
          type="text"
          placeholder="Search bots..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        />
        <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
      </div>
    {:else if filteredBots.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No bots found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 text-left">
              <th class="p-4 font-medium">Bot</th>
              <th class="p-4 font-medium">Gender</th>
              <th class="p-4 font-medium">Age</th>
              <th class="p-4 font-medium">Country</th>
              <th class="p-4 font-medium">Interests</th>
              <th class="p-4 font-medium">Status</th>
              <th class="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredBots as bot}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold">
                      {bot.nickname[0].toUpperCase()}
                    </div>
                    <div>
                      <div class="font-medium flex items-center gap-2">
                        {bot.nickname}
                        <Bot size={16} class="text-primary-500" />
                      </div>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  <span class={bot.gender === 'Male' ? 'text-blue-600' : 'text-pink-500'}>
                    {bot.gender}
                  </span>
                </td>
                <td class="p-4">
                  {bot.age} years
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <img 
                      src="https://flagcdn.com/{bot.countryCode}.svg" 
                      alt="{bot.country} flag"
                      class="w-4 h-3 object-cover rounded"
                    />
                    <span>{bot.country}</span>
                  </div>
                </td>
                <td class="p-4">
                  <div class="flex flex-wrap gap-1">
                    {#each bot.interests as interest}
                      <span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                        {interest}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {bot.inactive ? 'bg-gray-100 text-gray-800' : 'bg-success-100 text-success-800'}">
                    {bot.inactive ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      on:click={() => openEditModal(bot)}
                      title="Edit bot"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-error-500"
                      on:click={() => handleDelete(bot)}
                      title="Delete bot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Add/Edit Bot Modal -->
{#if showAddModal || showEditModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
      use:clickOutside={() => { showAddModal = false; showEditModal = false; }}
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium">
          {showEditModal ? 'Edit Bot' : 'Add New Bot'}
        </h3>
        <button 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={() => { showAddModal = false; showEditModal = false; }}
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="p-4">
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nickname *</label>
            <input
              type="text"
              bind:value={formData.nickname}
              class="input"
              required
              maxlength={20}
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Gender *</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="btn {formData.gender === 'Male' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => formData.gender = 'Male'}
              >
                Male
              </button>
              <button
                type="button"
                class="btn {formData.gender === 'Female' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => formData.gender = 'Female'}
              >
                Female
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Age *</label>
            <select bind:value={formData.age} class="input" required>
              <option value="">Select age</option>
              {#each Array.from({length: 63}, (_, i) => i + 18) as age}
                <option value={age}>{age} years</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Country *</label>
            <select 
              value={formData.country}
              on:change={handleCountryChange}
              class="input" 
              required
            >
              <option value="">Select country</option>
              {#each countries as country}
                <option value={country.name}>{country.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">
              Interests (Select up to 3)
            </label>
            <div class="flex flex-wrap gap-2">
              {#each interestOptions as interest}
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        {formData.interests.includes(interest)
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}"
                  on:click={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                bind:checked={formData.isActive}
                class="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span class="text-sm font-medium">Active</span>
            </label>
          </div>
        </form>
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          class="btn btn-outline"
          on:click={() => { showAddModal = false; showEditModal = false; }}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary"
          on:click={handleSubmit}
          disabled={submitting}
        >
          {#if submitting}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          {:else}
            {showEditModal ? 'Update Bot' : 'Add Bot'}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}