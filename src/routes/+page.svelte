<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { initializeFirebase, firestore } from '$lib/firebase';
  import { doc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import VipModal from '$components/VipModal.svelte';
  import { fade, fly } from 'svelte/transition';
  import toast from 'svelte-french-toast';
  import { Dice1 as Dice } from 'lucide-svelte';
  
  let nickname = '';
  let showVipModal = false;
  let isModalVisible = false;
  let isSubmitting = false;
  let validationError = '';
  let profanityList: string[] = [];
  let isCheckingAvailability = false;
  
  onMount(async () => {
    // Initialize Firebase first
    await initializeFirebase();
    
    // Then load profanity list from Firestore
    try {
      const settingsRef = doc(firestore, 'settings', 'site');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        profanityList = settingsDoc.data()?.nicknameProfanity || [];
      }
    } catch (error) {
      console.error('Error loading profanity list:', error);
    }
  });
  
  // Nickname validation
  async function validateNickname(value: string): Promise<{ isValid: boolean; error?: string }> {
    // Empty check
    if (!value) return { isValid: false, error: 'Please enter a nickname' };
    
    // Length check
    if (value.length < 3) return { isValid: false, error: 'Nickname must be at least 3 characters long' };
    if (value.length > 16) return { isValid: false, error: 'Nickname cannot exceed 16 characters' };
    
    // Start/end character check
    if (/^[^a-zA-Z]/.test(value)) return { isValid: false, error: 'Nickname must start with a letter' };
    if (/[^a-zA-Z0-9]$/.test(value)) return { isValid: false, error: 'Nickname must end with a letter or number' };
    
    // Character validation
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return { isValid: false, error: 'Only letters and numbers are allowed' };
    }
    
    // Number count check
    const numbers = value.match(/\d/g);
    if (numbers && numbers.length > 2) {
      return { isValid: false, error: 'Maximum 2 numbers allowed' };
    }
    
    // Consecutive letters check
    if (/(.)\1{3,}/.test(value)) {
      return { isValid: false, error: 'Maximum 3 identical consecutive letters allowed' };
    }
    
    // Profanity check
    const lowerValue = value.toLowerCase();
    for (const word of profanityList) {
      if (lowerValue.includes(word.toLowerCase())) {
        return { isValid: false, error: 'This nickname contains inappropriate content' };
      }
    }
    
    // Availability check
    isCheckingAvailability = true;
    try {
      const q = query(
        collection(firestore, 'profiles'),
        where('nickname', '==', value)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { isValid: false, error: 'This nickname is already taken' };
      }
    } catch (error) {
      console.error('Error checking nickname availability:', error);
      return { isValid: false, error: 'Error checking nickname availability' };
    } finally {
      isCheckingAvailability = false;
    }
    
    return { isValid: true };
  }
  
  // Real-time validation
  let validationTimeout: NodeJS.Timeout;
  async function handleNicknameInput() {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(async () => {
      if (nickname) {
        const result = await validateNickname(nickname);
        validationError = result.error || '';
      } else {
        validationError = '';
      }
    }, 300);
  }
  
  function generateRandomNickname() {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Quirky', 'Friendly', 'Swift', 'Witty', 'Gentle', 'Keen', 'Calm'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Raven', 'Hawk', 'Lion', 'Lynx'];
    
    let attempts = 0;
    const maxAttempts = 10;
    
    async function tryGenerateNickname() {
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomNum = Math.floor(Math.random() * 100);
      
      const generatedNickname = `${randomAdjective}${randomNoun}${randomNum}`;
      const validation = await validateNickname(generatedNickname);
      
      if (validation.isValid) {
        nickname = generatedNickname;
        validationError = '';
      } else if (attempts < maxAttempts) {
        attempts++;
        await tryGenerateNickname();
      } else {
        toast.error('Unable to generate a valid nickname. Please try manually.');
      }
    }
    
    tryGenerateNickname();
  }
  
  async function startChat() {
    if (isSubmitting) return;
    
    const validation = await validateNickname(nickname);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    isSubmitting = true;
    
    try {
      if (browser) {
        sessionStorage.setItem('nickname', nickname);
      }
      goto('/profile-setup');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }
  
  function toggleVipModal() {
    showVipModal = !showVipModal;
    isModalVisible = showVipModal;
  }
</script>

<svelte:head>
  <title>Chatwii - Anonymous 1-on-1 Chat</title>
  <meta name="description" content="Chat anonymously with like-minded individuals. No registration required." />
</svelte:head>

<div class="min-h-screen flex flex-col">
  <header class="w-full p-4 flex justify-between items-center">
    <div class="text-2xl font-display font-bold text-primary-500">Chatwii</div>
    <div class="flex items-center gap-3">
      <ThemeToggle />
      <button 
        on:click={toggleVipModal}
        class="btn bg-secondary-500 text-white hover:bg-secondary-600 px-4 py-2 rounded-lg font-medium flex items-center"
      >
        <span class="mr-1">✨</span> VIP
      </button>
    </div>
  </header>

  <main class="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
    <div 
      class="card max-w-md w-full mx-auto p-8 animate-fade-in" 
      in:fly={{ y: 20, duration: 400, delay: 200 }}
    >
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold mb-2">
          <span class="text-gray-900 dark:text-white">Text </span>
          <span class="text-secondary-500">Anonymously</span>
        </h1>
        <h2 class="text-xl mb-4">
          <span class="text-gray-900 dark:text-white">with </span>
          <span class="text-primary-400">no registration</span>
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          Unleash your creativity and connect with like-minded individuals on our chatting website, where conversations come to life.
        </p>
      </div>
      
      <div class="mb-6">
        <div class="relative">
          <input
            type="text"
            id="nickname"
            placeholder="Enter Nickname"
            class="input pr-12"
            bind:value={nickname}
            on:input={handleNicknameInput}
            maxlength={16}
          />
          <button 
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-500 transition-colors"
            on:click={generateRandomNickname}
            title="Generate random nickname"
          >
            <Dice size={20} />
          </button>
        </div>
        {#if validationError}
          <p class="mt-2 text-sm text-error-500">
            {validationError}
          </p>
        {/if}
      </div>
      
      <button
        on:click={startChat}
        disabled={!!validationError || isSubmitting || isCheckingAvailability}
        class="btn btn-primary w-full"
      >
        {#if isSubmitting}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        {:else if isCheckingAvailability}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Checking availability...
        {:else}
          Start Chat
        {/if}
      </button>
    </div>
    
    <div class="w-full max-w-3xl mx-auto mt-12 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Google AdSense Placeholder</p>
    </div>
  </main>
</div>

{#if showVipModal}
  <div 
    transition:fade={{ duration: 200 }} 
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    on:click|self={() => toggleVipModal()}
  >
    <div in:fly={{ y: 20, duration: 300 }}>
      <VipModal onClose={toggleVipModal} />
    </div>
  </div>
{/if}