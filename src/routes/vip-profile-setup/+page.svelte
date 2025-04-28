<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { firebaseAuth, firestore } from '$lib/firebase';
  import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
  import { authStore } from '$lib/stores/auth';
  import toast from 'svelte-french-toast';
  import iso3166 from 'iso-3166-1-alpha-2';
  
  let loading = true;
  let submitting = false;
  let gender = '';
  let age = '';
  let country = '';
  let countryCode = '';
  let interests: string[] = [];
  let nickname = '';
  
  const interestOptions = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Technology',
    'Art', 'Books', 'Travel', 'Food', 'Fashion'
  ];
  
  onMount(async () => {
    try {
      // Check authentication
      if (!firebaseAuth.currentUser) {
        toast.error('Please sign in first');
        goto('/');
        return;
      }
      
      // Get nickname from session storage or generate one
      nickname = sessionStorage.getItem('nickname') || `VIP_${Math.random().toString(36).slice(2, 8)}`;
      
      // Load existing profile data
      const userRef = doc(firestore, 'profiles', firebaseAuth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        gender = data.gender || '';
        age = data.age?.toString() || '';
        country = data.country || '';
        countryCode = data.countryCode || '';
        interests = data.interests || [];
      }
      
      // Try to detect country if not set
      if (!country) {
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          country = data.country_name;
          countryCode = iso3166.getCode(country)?.toLowerCase() || '';
        } catch (error) {
          console.error('Error detecting country:', error);
        }
      }
    } catch (error) {
      console.error('Error in onMount:', error);
      toast.error('Failed to load profile data');
    } finally {
      loading = false;
    }
  });
  
  async function handleSubmit() {
    if (!firebaseAuth.currentUser) {
      toast.error('Please sign in first');
      return;
    }
    
    if (!nickname || !gender || !age || !country) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    submitting = true;
    
    try {
      const userRef = doc(firestore, 'profiles', firebaseAuth.currentUser.uid);
      
      const profileData = {
        uid: firebaseAuth.currentUser.uid,
        nickname,
        gender,
        age: parseInt(age),
        country,
        countryCode: iso3166.getCode(country)?.toLowerCase() || '',
        interests,
        isVip: true,
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        // Create new profile
        await setDoc(userRef, {
          ...profileData,
          createdAt: new Date().toISOString()
        });
      } else {
        // Update existing profile
        await updateDoc(userRef, profileData);
      }
      
      // Update auth store
      authStore.update(state => ({
        ...state,
        user: profileData,
        loading: false,
        error: null
      }));
      
      toast.success('Profile updated successfully!');
      goto('/chat');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      submitting = false;
    }
  }
  
  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      interests = interests.filter(i => i !== interest);
    } else if (interests.length < 3) {
      interests = [...interests, interest];
    } else {
      toast.error('You can select up to 3 interests');
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
  {#if loading}
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  {:else}
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 class="text-center mb-8">
          <span class="text-2xl font-bold">Setup Your </span>
          <span class="text-2xl font-bold text-secondary-500">VIP Profile</span>
        </h1>
        
        <div class="mb-8">
          <p class="text-center text-lg font-medium mb-4">Select Your Avatar</p>
          <div class="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span class="text-4xl">👤</span>
          </div>
        </div>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium mb-2">Nickname *</label>
            <input
              type="text"
              bind:value={nickname}
              class="input"
              required
              maxlength={20}
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Gender *</label>
            <select
              bind:value={gender}
              class="input"
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Age *</label>
            <select bind:value={age} class="input" required>
              <option value="">Select age</option>
              {#each Array.from({length: 63}, (_, i) => i + 18) as ageValue}
                <option value={ageValue}>{ageValue} years</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Country *</label>
            <select bind:value={country} class="input" required>
              <option value="">Select country</option>
              {#each Object.entries(iso3166.getCountries()) as [code, name]}
                <option value={name}>{name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">
              Interests (Select up to 3)
            </label>
            <div class="flex flex-wrap gap-2">
              {#each interestOptions as interest}
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        {interests.includes(interest)
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}"
                  on:click={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              {/each}
            </div>
          </div>
          
          <button
            class="w-full bg-secondary-500 text-white rounded-lg py-3 hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleSubmit}
            disabled={submitting || !nickname || !gender || !age || !country}
          >
            {#if submitting}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            {:else}
              Go to Chat →
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>