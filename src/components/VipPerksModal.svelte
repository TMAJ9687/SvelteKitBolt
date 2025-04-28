```svelte
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Crown, X } from 'lucide-svelte';
  
  export let onClose: () => void;
  
  const perks = [
    {
      title: "Extended Messages",
      description: "Send longer messages (200 characters vs 120)",
      icon: "📝"
    },
    {
      title: "Message Management",
      description: "Reply to messages and delete your messages anytime",
      icon: "🗑️"
    },
    {
      title: "Real-time Translation",
      description: "Translate messages to your preferred language instantly",
      icon: "🌍"
    },
    {
      title: "Priority Listing",
      description: "Appear at the top of the user list",
      icon: "⭐"
    },
    {
      title: "No Restrictions",
      description: "Share links and phone numbers freely",
      icon: "🔓"
    },
    {
      title: "Unlimited History",
      description: "Access your entire chat history",
      icon: "📚"
    }
  ];
</script>

<div 
  class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
  in:fly={{ y: 20, duration: 200 }}
>
  <div class="flex justify-between items-center mb-6">
    <div class="flex items-center gap-3">
      <Crown class="w-6 h-6 text-yellow-500" />
      <h2 class="text-2xl font-bold">VIP Benefits</h2>
    </div>
    <button 
      on:click={onClose}
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <X size={24} />
    </button>
  </div>
  
  <div class="mb-6">
    <div class="mb-4 flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
      <span class="text-yellow-500 mr-2">👑</span>
      <p class="text-sm text-yellow-800 dark:text-yellow-200">
        Upgrade to VIP to unlock premium features and enhance your chat experience
      </p>
    </div>
  </div>
  
  <div class="grid gap-4 mb-6">
    {#each perks as perk}
      <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div class="text-xl">{perk.icon}</div>
        <div>
          <h3 class="font-medium mb-1">{perk.title}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">{perk.description}</p>
        </div>
      </div>
    {/each}
  </div>
  
  <button class="btn btn-primary w-full flex items-center justify-center gap-2">
    <Crown size={20} />
    <span>Become VIP</span>
  </button>
  
  <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
    Coming soon! VIP subscriptions will be available shortly.
  </p>
</div>
```