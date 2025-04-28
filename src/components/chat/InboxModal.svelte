<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
  import { Search, Trash2, X as CloseIcon } from 'lucide-svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import UserAvatar from '../UserAvatar.svelte';
  import type { ChatUser } from '$lib/types/chat';
  
  export let currentUser: ChatUser;
  export let onClose: () => void;
  export let onSelectChat: (user: any) => void;
  
  let loading = true;
  let conversations = [];
  let searchQuery = '';
  let showRequests = true;
  let unsubscribe: () => void;
  
  $: filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    return conv.otherUser.nickname.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  $: messageRequests = filteredConversations.filter(conv => !conv.hasInteracted);
  $: activeChats = filteredConversations.filter(conv => conv.hasInteracted);
  
  onMount(() => {
    loadConversations();
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
  
  function loadConversations() {
    // Create a compound query that will work with our index
    const q = query(
      collection(firestore, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    
    unsubscribe = onSnapshot(q, async (snapshot) => {
      const convMap = new Map();
      
      for (const doc of snapshot.docs) {
        const message = { id: doc.id, ...doc.data() };
        const otherUserId = message.senderUid === currentUser.uid ? message.receiverUid : message.senderUid;
        
        if (!convMap.has(otherUserId)) {
          try {
            const userDocRef = doc(firestore, 'profiles', otherUserId);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) continue;
            
            const otherUser = { uid: otherUserId, ...userDoc.data() };
            
            convMap.set(otherUserId, {
              otherUser,
              lastMessage: message,
              unreadCount: message.senderUid !== currentUser.uid && !message.status ? 1 : 0,
              hasInteracted: message.status === 'read' || message.senderUid === currentUser.uid
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else {
          const conv = convMap.get(otherUserId);
          if (message.timestamp > conv.lastMessage.timestamp) {
            conv.lastMessage = message;
          }
          if (message.senderUid !== currentUser.uid && !message.status) {
            conv.unreadCount++;
          }
        }
      }
      
      conversations = Array.from(convMap.values()).sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );
      
      loading = false;
    });
  }
  
  async function deleteConversation(otherUserId: string) {
    try {
      const batch = writeBatch(firestore);
      
      const q = query(
        collection(firestore, 'messages'),
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const snapshot = await q.get();
      
      snapshot.docs.forEach(doc => {
        const message = doc.data();
        if (message.participants.includes(otherUserId)) {
          batch.delete(doc.ref);
        }
      });
      
      await batch.commit();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }
  
  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  function getMessagePreview(message: any): string {
    if (message.text) return message.text;
    if (message.image) return '📷 Photo';
    if (message.audio) return '🎤 Voice message';
    return '';
  }
</script>

<div 
  class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
  on:click|self={onClose}
>
  <div 
    class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
    use:clickOutside={onClose}
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold">Inbox</h2>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors
                   {!showRequests ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' : 'bg-gray-100 dark:bg-gray-700'}"
            on:click={() => showRequests = false}
          >
            Chats
          </button>
          <button
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors
                   {showRequests ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' : 'bg-gray-100 dark:bg-gray-700'}"
            on:click={() => showRequests = true}
          >
            Requests {#if messageRequests.length > 0}
              <span class="ml-1 px-1.5 py-0.5 bg-error-500 text-white rounded-full text-xs">
                {messageRequests.length}
              </span>
            {/if}
          </button>
        </div>
      </div>
      <button
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={onClose}
      >
        <CloseIcon size={24} />
      </button>
    </div>
    
    <!-- Search -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <input
          type="text"
          placeholder="Search conversations..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        />
        <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>
    </div>
    
    <!-- Conversation List -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      {:else}
        {#if showRequests}
          {#if messageRequests.length === 0}
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              No message requests
            </div>
          {:else}
            {#each messageRequests as conv}
              <div class="relative group">
                <button
                  class="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 border-b border-gray-100 dark:border-gray-700"
                  on:click={() => { onSelectChat(conv.otherUser); onClose(); }}
                >
                  <UserAvatar user={conv.otherUser} />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="font-medium {conv.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}">
                        {conv.otherUser.nickname}
                      </span>
                      <span class="text-xs text-gray-500">
                        {formatTimestamp(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getMessagePreview(conv.lastMessage)}
                    </p>
                  </div>
                  {#if conv.unreadCount > 0}
                    <div class="min-w-[20px] h-5 px-1.5 bg-error-500 rounded-full flex items-center justify-center">
                      <span class="text-xs text-white font-medium">{conv.unreadCount}</span>
                    </div>
                  {/if}
                </button>
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  on:click={() => deleteConversation(conv.otherUser.uid)}
                  title="Delete conversation"
                >
                  <Trash2 size={16} class="text-error-500" />
                </button>
              </div>
            {/each}
          {/if}
        {:else}
          {#if activeChats.length === 0}
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          {:else}
            {#each activeChats as conv}
              <div class="relative group">
                <button
                  class="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 border-b border-gray-100 dark:border-gray-700"
                  on:click={() => { onSelectChat(conv.otherUser); onClose(); }}
                >
                  <UserAvatar user={conv.otherUser} />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="font-medium {conv.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}">
                        {conv.otherUser.nickname}
                      </span>
                      <span class="text-xs text-gray-500">
                        {formatTimestamp(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getMessagePreview(conv.lastMessage)}
                    </p>
                  </div>
                  {#if conv.unreadCount > 0}
                    <div class="min-w-[20px] h-5 px-1.5 bg-error-500 rounded-full flex items-center justify-center">
                      <span class="text-xs text-white font-medium">{conv.unreadCount}</span>
                    </div>
                  {/if}
                </button>
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  on:click={() => deleteConversation(conv.otherUser.uid)}
                  title="Delete conversation"
                >
                  <Trash2 size={16} class="text-error-500" />
                </button>
              </div>
            {/each}
          {/if}
        {/if}
      {/if}
    </div>
  </div>
</div>