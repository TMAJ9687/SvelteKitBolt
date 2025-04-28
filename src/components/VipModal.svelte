<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { firebaseAuth } from '$lib/firebase';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import toast from 'svelte-french-toast';
  import { goto } from '$app/navigation';
  
  export let onClose: () => void;
  
  let isLogin = true;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  
  // Test VIP account
  async function loginAsTestVIP() {
    loading = true;
    try {
      await signInWithEmailAndPassword(firebaseAuth, 'mmahj87@gmail.com', 'StormyIraq1987@');
      toast.success('Logged in as VIP user');
      goto('/vip-profile-setup');
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please check your credentials.');
    } finally {
      loading = false;
    }
  }
  
  // Login functionality
  async function handleLogin() {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    loading = true;
    
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      toast.success('Logged in successfully!');
      goto('/vip-profile-setup');
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      loading = false;
    }
  }
  
  // Signup functionality
  async function handleSignup() {
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    loading = true;
    
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      toast.success('Account created successfully!');
      goto('/vip-profile-setup');
      onClose();
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      toast.error(errorMessage);
    } finally {
      loading = false;
    }
  }
  
  // Handle form submission
  function handleSubmit() {
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  }
  
  // Toggle between login and signup forms
  function toggleForm() {
    isLogin = !isLogin;
  }
</script>

<div 
  class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
  in:fly={{ y: 20, duration: 200 }}
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">
      {isLogin ? 'Welcome Back!' : 'Create VIP Account'}
    </h2>
    <button 
      on:click={onClose}
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>
  
  <div class="mb-6">
    <div class="mb-4 flex items-center justify-center bg-secondary-100 dark:bg-secondary-900 p-3 rounded-lg">
      <span class="text-secondary-500 mr-2">✨</span>
      <p class="text-sm text-secondary-800 dark:text-secondary-200">
        {isLogin ? 'Access exclusive VIP features by logging in' : 'Become a VIP to access exclusive features'}
      </p>
    </div>
  </div>

  <!-- Test VIP Account Button -->
  <button
    on:click={loginAsTestVIP}
    class="w-full mb-6 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg py-3 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
  >
    {#if loading}
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
        Processing...
      </div>
    {:else}
      Try VIP Features (Test Account)
    {/if}
  </button>
  
  <div class="relative mb-6">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
    </div>
  </div>
  
  <form on:submit|preventDefault={handleSubmit}>
    <div class="mb-4">
      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Email address
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        placeholder="you@example.com"
        class="input"
        disabled={loading}
      />
    </div>
    
    <div class="mb-4">
      <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Password
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="••••••••"
        class="input"
        disabled={loading}
      />
    </div>
    
    {#if !isLogin}
      <div class="mb-4">
        <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirm-password"
          bind:value={confirmPassword}
          placeholder="••••••••"
          class="input"
          disabled={loading}
        />
      </div>
    {/if}
    
    <button
      type="submit"
      disabled={loading}
      class="btn btn-primary w-full mt-2"
    >
      {#if loading}
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      {:else}
        {isLogin ? 'Sign In' : 'Create Account'}
      {/if}
    </button>
    
    <div class="mt-4 text-center">
      <button
        type="button"
        on:click={toggleForm}
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  </form>
</div>