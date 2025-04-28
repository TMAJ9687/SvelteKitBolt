<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { firebaseAuth, firestore } from '$lib/firebase';
  import { signOut } from 'firebase/auth';
  import { doc, deleteDoc } from 'firebase/firestore';
  import toast from 'svelte-french-toast';
  import { History, MessageSquare, LogOut, Inbox, UserX } from 'lucide-svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import UserList from '$components/chat/UserList.svelte';
  import ChatArea from '$components/chat/ChatArea.svelte';
  import InboxModal from '$components/chat/InboxModal.svelte';
  import BlockedUsersModal from '$components/chat/BlockedUsersModal.svelte';
  import type { ChatUser } from '$lib/types/chat';
  
  let loading = true;
  let currentUser: ChatUser | null = null;
  let selectedUser: ChatUser | null = null;
  let showInbox = false;
  let showBlockedUsers = false;
  let showHistory = false;
  
  onMount(() => {
    const unsubscribe = authStore.subscribe((auth) => {
      if (!auth.loading) {
        if (!auth.user) {
          toast.error('Please set up your profile first');
          goto('/');
        } else {
          currentUser = auth.user as ChatUser;
          loading = false;
        }
      }
    });
    
    return unsubscribe;
  });
  
  function handleUserSelect(user: ChatUser) {
    selectedUser = user;
  }
  
  function handleCloseChat() {
    selectedUser = null;
  }
  
  async function handleLogout() {
    try {
      if (currentUser) {
        // For standard users, delete their profile
        if (!currentUser.isVip) {
          await deleteDoc(doc(firestore, 'profiles', currentUser.uid));
        }
        
        // Sign out from Firebase Auth
        await signOut(firebaseAuth);
        
        // Clear auth store
        authStore.update(state => ({
          ...state,
          user: null,
          loading: false,
          error: null
        }));
        
        toast.success('Logged out successfully');
        goto('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  }
</script>

<svelte:head>
  <title>Chat - Chatwii</title>
</svelte:head>

{#if loading || !currentUser}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
{:else}
  <div class="flex h-screen min-h-0 bg-gray-50 dark:bg-gray-900">
    <!-- User list sidebar -->
    <UserList
      currentUserId={currentUser.uid}
      onUserSelect={handleUserSelect}
    />
    
    <!-- Main chat area -->
    <div class="flex-1 flex flex-col min-h-0 h-full">
      <!-- Chat header -->
      <div class="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
        <h1 class="text-xl font-bold">Chatwii Chat</h1>
        <div class="flex items-center gap-4">
          {#if currentUser.isVip}
            <button 
              class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              on:click={() => showHistory = true}
              title="Chat History"
            >
              <History size={20} />
            </button>
            <button 
              class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              on:click={() => showInbox = true}
              title="Inbox"
            >
              <Inbox size={20} />
            </button>
          {/if}
          <button 
            class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            on:click={() => showBlockedUsers = true}
            title="Blocked Users"
          >
            <UserX size={20} />
          </button>
          <ThemeToggle />
          <button 
            class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-error-500"
            on:click={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      <!-- Chat area -->
      <ChatArea
        {currentUser}
        {selectedUser}
        on:closeChat={handleCloseChat}
      />
    </div>
  </div>
  
  {#if showInbox && currentUser.isVip}
    <InboxModal
      {currentUser}
      onClose={() => showInbox = false}
      onSelectChat={handleUserSelect}
    />
  {/if}

  {#if showBlockedUsers}
    <BlockedUsersModal
      {currentUser}
      onClose={() => showBlockedUsers = false}
    />
  {/if}
{/if}