<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initializeFirebase } from '$lib/firebase';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import toast, { Toaster } from 'svelte-french-toast';
  
  let mounted = false;

  // Initialize theme based on user preference
  onMount(async () => {
    if (browser) {
      try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Set theme based on user preference
        const darkModePreference = localStorage.getItem('darkMode');
        if (darkModePreference === 'true' || 
            (!darkModePreference && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
        
        mounted = true;
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }
  });
</script>

{#if mounted || !browser}
<div class="min-h-screen flex flex-col">
  <Toaster position="top-right" />
  <slot />
</div>
{:else}
<div class="min-h-screen flex items-center justify-center">
  <!-- Loading state while Firebase initializes -->
  <p>Loading...</p>
</div>
{/if}