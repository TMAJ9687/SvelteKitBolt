<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { firebaseAuth } from '$lib/firebase';
  import { authStore } from '$lib/stores/auth';
  import toast from 'svelte-french-toast';
  import { 
    Users, Settings, MessageSquare, 
    BarChart, LogOut, Menu, X,
    Crown, Bot, Flag, UserX
  } from 'lucide-svelte';
  
  let sidebarOpen = true;
  let currentUser: any = null;
  
  onMount(() => {
    const unsubscribe = authStore.subscribe((auth) => {
      if (!auth.loading) {
        currentUser = auth.user;
        if (!currentUser?.isAdmin) {
          toast.error('Unauthorized access');
          goto('/');
        }
      }
    });
    
    return unsubscribe;
  });
  
  const menuItems = [
    {
      title: 'User Management',
      items: [
        { label: 'VIP Users', icon: Crown, href: '/admin/users/vip' },
        { label: 'Standard Users', icon: Users, href: '/admin/users/standard' },
        { label: 'Banned Users', icon: UserX, href: '/admin/users/banned' },
        { label: 'Bots', icon: Bot, href: '/admin/users/bots' }
      ]
    },
    {
      title: 'Site Management',
      items: [
        { label: 'General Settings', icon: Settings, href: '/admin/settings/general' }
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        { label: 'User Reports', icon: Flag, href: '/admin/reports' },
        { label: 'Statistics', icon: BarChart, href: '/admin/stats' }
      ]
    }
  ];
  
  async function handleLogout() {
    try {
      await firebaseAuth.signOut();
      goto('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
  <!-- Sidebar -->
  <aside 
    class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0"
  >
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
      <span class="text-xl font-bold text-primary-500">Admin Panel</span>
      <button 
        class="md:hidden"
        on:click={() => sidebarOpen = false}
      >
        <X size={20} />
      </button>
    </div>
    
    <nav class="p-4 space-y-8">
      {#each menuItems as section}
        <div>
          <h2 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {section.title}
          </h2>
          <ul class="space-y-1">
            {#each section.items as item}
              <li>
                <a 
                  href={item.href}
                  class="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svelte:component this={item.icon} size={18} />
                  <span>{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
      
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          on:click={handleLogout}
          class="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  </aside>
  
  <!-- Main content -->
  <div class="flex-1 flex flex-col min-h-0">
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      <button 
        class="md:hidden mr-4"
        on:click={() => sidebarOpen = true}
      >
        <Menu size={24} />
      </button>
      
      <div class="flex-1">
        <h1 class="text-xl font-semibold">Dashboard</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <a 
          href="/chat"
          target="_blank"
          class="btn btn-outline"
        >
          Open Chat
        </a>
      </div>
    </header>
    
    <main class="flex-1 overflow-auto p-6">
      <slot />
    </main>
  </div>
</div>