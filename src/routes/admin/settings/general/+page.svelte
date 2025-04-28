<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore, storage } from '$lib/firebase';
  import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
  import { AlertTriangle, X, Plus, Upload } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';

  let loading = true;
  let saving = false;
  let settings = {
    maintenanceMode: false,
    adsenseHeader: '',
    adsenseSidebar: '',
    adsenseFooter: '',
    maintenanceMessage: 'We are currently performing maintenance. Please check back later.',
    vipPrices: {
      '1_month': 9.99,
      '3_months': 24.99,
      '12_months': 89.99
    },
    nicknameProfanity: [] as string[],
    chatProfanity: [] as string[],
    avatars: {
      standard_male: [] as string[],
      standard_female: [] as string[],
      vip_male: [] as string[],
      vip_female: [] as string[]
    }
  };

  let newNicknameProfanity = '';
  let newChatProfanity = '';
  let selectedAvatarType: keyof typeof settings.avatars | null = null;
  let fileInput: HTMLInputElement;

  onMount(async () => {
    try {
      const settingsRef = doc(firestore, 'settings', 'site');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        settings = { ...settings, ...docSnap.data() };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    saving = true;
    try {
      const settingsRef = doc(firestore, 'settings', 'site');
      await setDoc(settingsRef, settings, { merge: true });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      saving = false;
    }
  }

  async function addProfanityWord(type: 'nickname' | 'chat') {
    const word = type === 'nickname' ? newNicknameProfanity.trim() : newChatProfanity.trim();
    if (!word) return;

    try {
      const settingsRef = doc(firestore, 'settings', 'site');
      const field = type === 'nickname' ? 'nicknameProfanity' : 'chatProfanity';
      
      await setDoc(settingsRef, {
        [field]: arrayUnion(word.toLowerCase())
      }, { merge: true });

      if (type === 'nickname') {
        settings.nicknameProfanity = [...settings.nicknameProfanity, word];
        newNicknameProfanity = '';
      } else {
        settings.chatProfanity = [...settings.chatProfanity, word];
        newChatProfanity = '';
      }

      toast.success('Word added to filter');
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error('Failed to add word');
    }
  }

  async function removeProfanityWord(type: 'nickname' | 'chat', word: string) {
    try {
      const settingsRef = doc(firestore, 'settings', 'site');
      const field = type === 'nickname' ? 'nicknameProfanity' : 'chatProfanity';
      
      await setDoc(settingsRef, {
        [field]: arrayRemove(word)
      }, { merge: true });

      if (type === 'nickname') {
        settings.nicknameProfanity = settings.nicknameProfanity.filter(w => w !== word);
      } else {
        settings.chatProfanity = settings.chatProfanity.filter(w => w !== word);
      }

      toast.success('Word removed from filter');
    } catch (error) {
      console.error('Error removing word:', error);
      toast.error('Failed to remove word');
    }
  }

  async function handleAvatarUpload(event: Event) {
    if (!selectedAvatarType) return;

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG images are allowed');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    try {
      const fileName = `avatars/${selectedAvatarType}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const settingsRef = doc(firestore, 'settings', 'site');
      await setDoc(settingsRef, {
        avatars: {
          ...settings.avatars,
          [selectedAvatarType]: [...settings.avatars[selectedAvatarType], url]
        }
      }, { merge: true });

      settings.avatars[selectedAvatarType] = [...settings.avatars[selectedAvatarType], url];
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  async function deleteAvatar(type: keyof typeof settings.avatars, url: string) {
    try {
      const urlPath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      const storageRef = ref(storage, urlPath);
      
      await deleteObject(storageRef);
      
      const settingsRef = doc(firestore, 'settings', 'site');
      await setDoc(settingsRef, {
        avatars: {
          ...settings.avatars,
          [type]: settings.avatars[type].filter(u => u !== url)
        }
      }, { merge: true });

      settings.avatars[type] = settings.avatars[type].filter(u => u !== url);
      toast.success('Avatar deleted successfully');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold mb-2">General Settings</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Configure site-wide settings and features
      </p>
    </div>
  </div>

  {#if loading}
    <div class="card p-6">
      <div class="flex justify-center">
        <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
      </div>
    </div>
  {:else}
    <div class="grid gap-6">
      <!-- VIP Pricing -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">VIP Pricing</h3>
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">1 Month Price ($)</label>
            <input
              type="number"
              bind:value={settings.vipPrices['1_month']}
              class="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">3 Months Price ($)</label>
            <input
              type="number"
              bind:value={settings.vipPrices['3_months']}
              class="input"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">12 Months Price ($)</label>
            <input
              type="number"
              bind:value={settings.vipPrices['12_months']}
              class="input"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <!-- Profanity Filters -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">Profanity Filters</h3>
        
        <div class="grid gap-6">
          <!-- Nickname Profanity -->
          <div>
            <h4 class="font-medium mb-2">Nickname Profanity List</h4>
            <div class="flex gap-2 mb-3">
              <input
                type="text"
                bind:value={newNicknameProfanity}
                class="input"
                placeholder="Enter word to ban..."
              />
              <button
                class="btn btn-primary"
                on:click={() => addProfanityWord('nickname')}
                disabled={!newNicknameProfanity.trim()}
              >
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each settings.nicknameProfanity as word}
                <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  <span>{word}</span>
                  <button
                    class="text-gray-500 hover:text-error-500"
                    on:click={() => removeProfanityWord('nickname', word)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
            </div>
          </div>

          <!-- Chat Profanity -->
          <div>
            <h4 class="font-medium mb-2">Chat Profanity List</h4>
            <div class="flex gap-2 mb-3">
              <input
                type="text"
                bind:value={newChatProfanity}
                class="input"
                placeholder="Enter word to ban..."
              />
              <button
                class="btn btn-primary"
                on:click={() => addProfanityWord('chat')}
                disabled={!newChatProfanity.trim()}
              >
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each settings.chatProfanity as word}
                <div class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  <span>{word}</span>
                  <button
                    class="text-gray-500 hover:text-error-500"
                    on:click={() => removeProfanityWord('chat', word)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Avatar Management -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">Avatar Management</h3>
        
        <div class="grid gap-6">
          <!-- Standard Male Avatars -->
          <div>
            <h4 class="font-medium mb-2">Standard Male Avatars</h4>
            <div class="grid grid-cols-6 gap-4">
              {#each settings.avatars.standard_male as url}
                <div class="relative group">
                  <img
                    src={url}
                    alt="Avatar"
                    class="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    class="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    on:click={() => deleteAvatar('standard_male', url)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
              <button
                class="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                on:click={() => { selectedAvatarType = 'standard_male'; fileInput?.click(); }}
              >
                <Plus size={24} class="text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Standard Female Avatars -->
          <div>
            <h4 class="font-medium mb-2">Standard Female Avatars</h4>
            <div class="grid grid-cols-6 gap-4">
              {#each settings.avatars.standard_female as url}
                <div class="relative group">
                  <img
                    src={url}
                    alt="Avatar"
                    class="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    class="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    on:click={() => deleteAvatar('standard_female', url)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
              <button
                class="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                on:click={() => { selectedAvatarType = 'standard_female'; fileInput?.click(); }}
              >
                <Plus size={24} class="text-gray-400" />
              </button>
            </div>
          </div>

          <!-- VIP Male Avatars -->
          <div>
            <h4 class="font-medium mb-2">VIP Male Avatars</h4>
            <div class="grid grid-cols-6 gap-4">
              {#each settings.avatars.vip_male as url}
                <div class="relative group">
                  <img
                    src={url}
                    alt="Avatar"
                    class="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    class="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    on:click={() => deleteAvatar('vip_male', url)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
              <button
                class="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                on:click={() => { selectedAvatarType = 'vip_male'; fileInput?.click(); }}
              >
                <Plus size={24} class="text-gray-400" />
              </button>
            </div>
          </div>

          <!-- VIP Female Avatars -->
          <div>
            <h4 class="font-medium mb-2">VIP Female Avatars</h4>
            <div class="grid grid-cols-6 gap-4">
              {#each settings.avatars.vip_female as url}
                <div class="relative group">
                  <img
                    src={url}
                    alt="Avatar"
                    class="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    class="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    on:click={() => deleteAvatar('vip_female', url)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
              <button
                class="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                on:click={() => { selectedAvatarType = 'vip_female'; fileInput?.click(); }}
              >
                <Plus size={24} class="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png"
          class="hidden"
          bind:this={fileInput}
          on:change={handleAvatarUpload}
        />
      </div>

      <!-- Maintenance Mode -->
      <div class="card p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-1">Maintenance Mode</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              When enabled, the site will be inaccessible to regular users
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              bind:checked={settings.maintenanceMode}
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {#if settings.maintenanceMode}
          <div class="mt-4">
            <label class="block text-sm font-medium mb-1">
              Maintenance Message
            </label>
            <textarea
              bind:value={settings.maintenanceMessage}
              class="input"
              rows="3"
              placeholder="Enter maintenance message..."
            ></textarea>
          </div>
        {/if}
      </div>

      <!-- AdSense Settings -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">Advertisement Settings</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              Header Ad Code
            </label>
            <textarea
              bind:value={settings.adsenseHeader}
              class="input font-mono text-sm"
              rows="4"
              placeholder="Paste your AdSense code here..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Sidebar Ad Code
            </label>
            <textarea
              bind:value={settings.adsenseSidebar}
              class="input font-mono text-sm"
              rows="4"
              placeholder="Paste your AdSense code here..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Footer Ad Code
            </label>
            <textarea
              bind:value={settings.adsenseFooter}
              class="input font-mono text-sm"
              rows="4"
              placeholder="Paste your AdSense code here..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          class="btn btn-primary min-w-[120px]"
          on:click={handleSave}
          disabled={saving}
        >
          {#if saving}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          {:else}
            Save Changes
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>