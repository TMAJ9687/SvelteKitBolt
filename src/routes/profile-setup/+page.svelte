<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import toast from 'svelte-french-toast';
  import { firebaseAuth, firestore } from '$lib/firebase';
  import { signInAnonymously } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { authStore, type UserProfile } from '$lib/stores/auth';
  import FormField from '$components/FormField.svelte';
  import { ChevronDown, ArrowLeft } from 'lucide-svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import iso3166 from 'iso-3166-1-alpha-2';
  
  let loading = true;
  let submitting = false;
  let gender = '';
  let age = '';
  let country = '';
  let interests: string[] = [];
  let showInterests = false;
  let nickname = '';
  let countryCode = '';
  
  const interestOptions = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Technology',
    'Art', 'Books', 'Travel', 'Food', 'Fashion'
  ];
  
  $: isValid = gender && age && country && !submitting;
  
  async function detectCountry() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      country = data.country_name;
      countryCode = iso3166.getCode(country)?.toLowerCase() || '';
    } catch (error) {
      console.error('Error detecting country:', error);
      country = 'Unknown';
    }
  }
  
  async function handleSubmit() {
    if (!isValid) return;
    
    submitting = true;
    
    try {
      // Initialize Firebase if not already initialized
      if (!firebaseAuth) {
        await import('$lib/firebase').then(({ initializeFirebase }) => initializeFirebase());
      }
      
      const { user } = await signInAnonymously(firebaseAuth);
      
      const profile: UserProfile = {
        uid: user.uid,
        nickname,
        gender,
        age: parseInt(age),
        country: country,
        countryCode,
        interests,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(firestore, 'profiles', user.uid), profile);
      
      authStore.update(state => ({
        ...state,
        user: profile,
        loading: false,
        error: null
      }));
      
      toast.success('Profile created successfully!');
      goto('/chat');
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      submitting = false;
    }
  }
  
  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      interests = interests.filter(i => i !== interest);
    } else if (interests.length < 2) {
      interests = [...interests, interest];
    } else {
      toast.error('You can select up to 2 interests');
    }
  }
  
  onMount(async () => {
    if (browser) {
      nickname = sessionStorage.getItem('nickname') || '';
      if (!nickname) {
        goto('/');
        return;
      }
      
      await detectCountry();
    }
    loading = false;
  });
</script>

<div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  <header class="w-full p-4 shadow-sm bg-white dark:bg-gray-800">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <div class="flex items-center gap-4">
        <button
          on:click={() => goto('/')}
          class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <a href="/" class="text-2xl font-display font-bold text-primary-500">Chatwii</a>
      </div>
      <div class="flex items-center gap-3">
        <ThemeToggle />
        <button 
          class="btn bg-secondary-500 text-white hover:bg-secondary-600 px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <span class="mr-1">✨</span> VIP
        </button>
      </div>
    </div>
  </header>
  
  <main class="flex-grow flex flex-col items-center justify-center p-4">
    {#if loading}
      <div class="card p-8 w-full max-w-md mx-auto">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    {:else}
      <div class="card p-8 w-full max-w-md mx-auto">
        <h1 class="text-2xl font-bold mb-6">Hello, {nickname}!</h1>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <FormField label="Gender" required>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="btn {gender === 'Male' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => gender = 'Male'}
              >
                Male
              </button>
              <button
                type="button"
                class="btn {gender === 'Female' ? 'btn-primary' : 'btn-outline'}"
                on:click={() => gender = 'Female'}
              >
                Female
              </button>
            </div>
          </FormField>
          
          <FormField label="Age" required>
            <select bind:value={age} class="input" required>
              <option value="">Select your age</option>
              {#each Array.from({length: 63}, (_, i) => i + 18) as ageValue}
                <option value={ageValue}>{ageValue} years</option>
              {/each}
            </select>
          </FormField>
          
          <button
            type="submit"
            disabled={!isValid}
            class="btn btn-primary w-full"
          >
            {#if submitting}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            {:else}
              Start Chatting
            {/if}
          </button>
          
          <FormField label="Country">
            <div class="flex items-center gap-2 input bg-gray-50 cursor-not-allowed">
              {#if countryCode}
                <img 
                  src="https://flagcdn.com/{countryCode}.svg" 
                  alt="{country} flag"
                  class="w-6 h-4 object-cover rounded"
                />
              {/if}
              <span>{country}</span>
            </div>
          </FormField>
          
          <div>
            <button
              type="button"
              class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              on:click={() => showInterests = !showInterests}
            >
              <span class="font-medium">Interests (optional)</span>
              <ChevronDown
                size={20}
                class="transform transition-transform {showInterests ? 'rotate-180' : ''}"
              />
            </button>
            
            {#if showInterests}
              <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex flex-wrap gap-2">
                  {#each interestOptions as interest}
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-full text-sm font-medium
                            {interests.includes(interest)
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                      on:click={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </form>
      </div>
    {/if}
  </main>
  
  <!-- AdSense Placeholder -->
  <div class="w-full max-w-3xl mx-auto p-4 mb-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
    <p class="text-gray-500 dark:text-gray-400">Google AdSense Placeholder</p>
  </div>
</div>