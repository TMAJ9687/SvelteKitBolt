<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
  import { Search, MessageSquare, Trash2, X, Check } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';

  interface Feedback {
    id: string;
    message: string;
    userUid?: string;
    nickname?: string;
    email?: string;
    timestamp: string;
    read: boolean;
  }

  let loading = true;
  let feedback: Feedback[] = [];
  let searchQuery = '';
  let showDeleteModal = false;
  let selectedFeedback: Feedback | null = null;
  let filterStatus: 'all' | 'unread' | 'read' = 'all';
  let showFullMessage: string | null = null;

  $: filteredFeedback = feedback.filter(item => {
    if (!searchQuery && filterStatus === 'all') return true;
    
    let matchesSearch = true;
    let matchesStatus = true;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      matchesSearch = (item.message?.toLowerCase().includes(searchLower) ||
                      item.nickname?.toLowerCase().includes(searchLower) ||
                      item.email?.toLowerCase().includes(searchLower));
    }
    
    if (filterStatus !== 'all') {
      matchesStatus = filterStatus === 'unread' ? !item.read : item.read;
    }
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  onMount(() => {
    const q = query(
      collection(firestore, 'feedback'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      feedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));
      loading = false;
    }, (error) => {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
      loading = false;
    });

    return unsubscribe;
  });

  async function markAsRead(item: Feedback) {
    try {
      const feedbackRef = doc(firestore, 'feedback', item.id);
      await updateDoc(feedbackRef, {
        read: true,
        readAt: new Date().toISOString()
      });
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      toast.error('Failed to update status');
    }
  }

  async function handleDelete() {
    if (!selectedFeedback) return;
    
    try {
      await deleteDoc(doc(firestore, 'feedback', selectedFeedback.id));
      toast.success('Feedback deleted');
      showDeleteModal = false;
      selectedFeedback = null;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  function truncateText(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold mb-2">User Feedback</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Review and manage user feedback and suggestions
      </p>
    </div>
  </div>

  <div class="card">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <input
            type="text"
            placeholder="Search feedback..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
          />
          <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>

        <select
          bind:value={filterStatus}
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
      </div>
    {:else if filteredFeedback.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No feedback found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 text-left">
              <th class="p-4 font-medium">#</th>
              <th class="p-4 font-medium">User</th>
              <th class="p-4 font-medium">Message</th>
              <th class="p-4 font-medium">Date</th>
              <th class="p-4 font-medium">Status</th>
              <th class="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredFeedback as item, index}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-4 text-gray-500">
                  {index + 1}
                </td>
                <td class="p-4">
                  <div>
                    {#if item.nickname}
                      <div class="font-medium">{item.nickname}</div>
                    {:else}
                      <div class="text-gray-500 italic">Anonymous</div>
                    {/if}
                    {#if item.email}
                      <div class="text-sm text-gray-500">{item.email}</div>
                    {/if}
                    {#if item.userUid}
                      <div class="text-xs text-gray-400">UID: {item.userUid}</div>
                    {/if}
                  </div>
                </td>
                <td class="p-4 max-w-xl">
                  <div class="relative group">
                    {#if showFullMessage === item.id}
                      <div 
                        class="absolute bottom-full left-0 mb-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-96 z-10"
                        use:clickOutside={() => showFullMessage = null}
                      >
                        {item.message}
                      </div>
                    {/if}
                    <button 
                      class="text-left hover:text-primary-500"
                      on:click={() => showFullMessage = showFullMessage === item.id ? null : item.id}
                    >
                      {truncateText(item.message)}
                    </button>
                  </div>
                </td>
                <td class="p-4 text-gray-500">
                  {formatDate(item.timestamp)}
                </td>
                <td class="p-4">
                  {#if item.read}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-200">
                      Read
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                      Unread
                    </span>
                  {/if}
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    {#if !item.read}
                      <button
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-primary-500"
                        on:click={() => markAsRead(item)}
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    {/if}
                    <button
                      class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-error-500"
                      on:click={() => { selectedFeedback = item; showDeleteModal = true; }}
                      title="Delete feedback"
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

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedFeedback}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
      use:clickOutside={() => { showDeleteModal = false; selectedFeedback = null; }}
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium">Delete Feedback</h3>
        <button 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={() => { showDeleteModal = false; selectedFeedback = null; }}
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="p-4">
        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this feedback? This action cannot be undone.
        </p>
        
        <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {selectedFeedback.message}
          </p>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          class="btn btn-outline"
          on:click={() => { showDeleteModal = false; selectedFeedback = null; }}
        >
          Cancel
        </button>
        <button 
          class="btn bg-error-500 text-white hover:bg-error-600"
          on:click={handleDelete}
        >
          Delete Feedback
        </button>
      </div>
    </div>
  </div>
{/if}