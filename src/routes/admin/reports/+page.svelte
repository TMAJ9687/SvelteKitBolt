<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase';
  import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
  import { Search, Flag, User, Filter, X } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { clickOutside } from '$lib/actions/clickOutside';
  import toast from 'svelte-french-toast';
  import type { UserReport, ChatUser } from '$lib/types/chat';

  let loading = true;
  let reports: UserReport[] = [];
  let searchQuery = '';
  let statusFilter: 'all' | 'pending' | 'reviewed' | 'resolved' = 'all';
  let showUserModal = false;
  let selectedUser: ChatUser | null = null;
  let sortBy: 'date' | 'status' = 'date';
  let sortDirection: 'asc' | 'desc' = 'desc';

  $: filteredReports = reports
    .filter(report => {
      if (!searchQuery && statusFilter === 'all') return true;
      
      let matchesSearch = true;
      let matchesStatus = true;
      
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        matchesSearch = report.reportedUid.toLowerCase().includes(searchLower) ||
                       report.reporterUid.toLowerCase().includes(searchLower) ||
                       report.reason.toLowerCase().includes(searchLower);
      }
      
      if (statusFilter !== 'all') {
        matchesStatus = report.status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'desc'
          ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        const statusOrder = { pending: 0, reviewed: 1, resolved: 2 };
        const diff = statusOrder[a.status] - statusOrder[b.status];
        return sortDirection === 'desc' ? -diff : diff;
      }
    });

  onMount(() => {
    const q = query(
      collection(firestore, 'reports'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserReport));
      loading = false;
    }, (error) => {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
      loading = false;
    });

    return unsubscribe;
  });

  async function updateReportStatus(report: UserReport, newStatus: 'reviewed' | 'resolved') {
    try {
      const reportRef = doc(firestore, 'reports', report.id);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Report marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  }

  async function viewUserProfile(uid: string) {
    try {
      const userRef = doc(firestore, 'profiles', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        selectedUser = {
          uid,
          ...userSnap.data()
        } as ChatUser;
        showUserModal = true;
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user profile');
    }
  }

  function formatDate(timestamp: any): string {
    return new Date(timestamp).toLocaleString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'resolved':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold mb-2">User Reports</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Manage and review user reports
      </p>
    </div>
  </div>

  <div class="card">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-4">
        <div class="flex-1 relative">
          <input
            type="text"
            placeholder="Search reports..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
          />
          <Search class="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>

        <select
          bind:value={statusFilter}
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          bind:value={sortBy}
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>

        <button
          class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          on:click={() => sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'}
          title={sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
        >
          {#if sortDirection === 'asc'}
            ↑
          {:else}
            ↓
          {/if}
        </button>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <Circle size="60" color="#2AB0A8" unit="px" duration="1s" />
      </div>
    {:else if filteredReports.length === 0}
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No reports found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 text-left">
              <th class="p-4 font-medium">Reported User</th>
              <th class="p-4 font-medium">Reporter</th>
              <th class="p-4 font-medium">Reason</th>
              <th class="p-4 font-medium">Date</th>
              <th class="p-4 font-medium">Status</th>
              <th class="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredReports as report}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-4">
                  <button
                    class="flex items-center gap-2 hover:text-primary-500"
                    on:click={() => viewUserProfile(report.reportedUid)}
                  >
                    <User size={16} />
                    <span>{report.reportedUid}</span>
                  </button>
                </td>
                <td class="p-4">
                  <button
                    class="flex items-center gap-2 hover:text-primary-500"
                    on:click={() => viewUserProfile(report.reporterUid)}
                  >
                    <Flag size={16} />
                    <span>{report.reporterUid}</span>
                  </button>
                </td>
                <td class="p-4">
                  <div>
                    <div class="font-medium">{report.reason}</div>
                    {#if report.details}
                      <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {report.details}
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400">
                  {formatDate(report.timestamp)}
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(report.status)}">
                    {report.status}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    {#if report.status === 'pending'}
                      <button
                        class="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        on:click={() => updateReportStatus(report, 'reviewed')}
                      >
                        Mark Reviewed
                      </button>
                    {:else if report.status === 'reviewed'}
                      <button
                        class="px-3 py-1 text-sm font-medium text-success-600 hover:text-success-700 dark:text-success-400 dark:hover:text-success-300"
                        on:click={() => updateReportStatus(report, 'resolved')}
                      >
                        Mark Resolved
                      </button>
                    {/if}
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

<!-- User Profile Modal -->
{#if showUserModal && selectedUser}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
      use:clickOutside={() => { showUserModal = false; selectedUser = null; }}
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-medium">User Profile</h3>
        <button 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={() => { showUserModal = false; selectedUser = null; }}
        >
          <X size={24} />
        </button>
      </div>
      
      <div class="p-4">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-semibold">
              {selectedUser.nickname[0].toUpperCase()}
            </div>
            <div>
              <div class="text-xl font-semibold">{selectedUser.nickname}</div>
              <div class="text-gray-500 dark:text-gray-400">
                {selectedUser.gender}, {selectedUser.age}
              </div>
            </div>
          </div>

          <div>
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Location
            </div>
            <div class="flex items-center gap-2">
              <img 
                src="https://flagcdn.com/{selectedUser.countryCode}.svg" 
                alt="{selectedUser.country} flag"
                class="w-4 h-3 object-cover rounded"
              />
              <span>{selectedUser.country}</span>
            </div>
          </div>

          <div>
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Interests
            </div>
            <div class="flex flex-wrap gap-2">
              {#each selectedUser.interests as interest}
                <span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                  {interest}
                </span>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Account Status
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-sm">Member since:</span>
                <span class="text-sm">{formatDate(selectedUser.createdAt)}</span>
              </div>
              {#if selectedUser.isVip}
                <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  VIP Member
                </div>
              {/if}
              {#if selectedUser.banned}
                <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800">
                  Banned
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}