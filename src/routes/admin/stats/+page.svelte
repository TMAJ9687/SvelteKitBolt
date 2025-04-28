<script lang="ts">
  import { BarChart, Users, MessageSquare, Crown } from 'lucide-svelte';

  // Placeholder data - in a real app, this would come from your database
  const stats = {
    totalUsers: 1234,
    activeUsers: 856,
    vipUsers: 123,
    totalMessages: 45678,
    activeChats: 234,
    averageResponseTime: '2.5 minutes'
  };
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistics Dashboard</h1>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Total Users Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
        </div>
        <Users class="text-primary-500" size={24} />
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {stats.activeUsers} active users
      </p>
    </div>

    <!-- VIP Users Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">VIP Users</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.vipUsers}</p>
        </div>
        <Crown class="text-primary-500" size={24} />
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {((stats.vipUsers / stats.totalUsers) * 100).toFixed(1)}% of total users
      </p>
    </div>

    <!-- Messages Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMessages}</p>
        </div>
        <MessageSquare class="text-primary-500" size={24} />
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {stats.activeChats} active chats
      </p>
    </div>

    <!-- Response Time Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Average Response Time</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{stats.averageResponseTime}</p>
        </div>
        <BarChart class="text-primary-500" size={24} />
      </div>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Note</h2>
    <p class="text-gray-600 dark:text-gray-400">
      This is a placeholder statistics page. In a production environment, you would want to:
    </p>
    <ul class="list-disc list-inside mt-2 text-gray-600 dark:text-gray-400">
      <li>Connect to your database to fetch real-time statistics</li>
      <li>Add data visualization charts</li>
      <li>Implement date range filters</li>
      <li>Add export functionality</li>
    </ul>
  </div>
</div>