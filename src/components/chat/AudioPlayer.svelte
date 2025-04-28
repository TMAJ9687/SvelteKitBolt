<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Play, Pause } from 'lucide-svelte';
  
  export let audioUrl: string;
  export let duration: number;
  
  let audio: HTMLAudioElement;
  let isPlaying = false;
  let currentTime = 0;
  let progress = 0;
  
  $: progress = (currentTime / duration) * 100;
  
  function togglePlay() {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }
  
  function updateTime() {
    currentTime = Math.floor(audio.currentTime);
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  onMount(() => {
    audio = new Audio(audioUrl);
    audio.addEventListener('play', () => isPlaying = true);
    audio.addEventListener('pause', () => isPlaying = false);
    audio.addEventListener('ended', () => {
      isPlaying = false;
      currentTime = 0;
    });
    audio.addEventListener('timeupdate', updateTime);
  });
  
  onDestroy(() => {
    if (audio) {
      audio.pause();
      audio.removeEventListener('play', () => isPlaying = true);
      audio.removeEventListener('pause', () => isPlaying = false);
      audio.removeEventListener('ended', () => {
        isPlaying = false;
        currentTime = 0;
      });
      audio.removeEventListener('timeupdate', updateTime);
    }
  });
</script>

<div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2">
  <button
    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
    on:click={togglePlay}
  >
    {#if isPlaying}
      <Pause size={18} />
    {:else}
      <Play size={18} />
    {/if}
  </button>
  
  <div class="flex-1">
    <div class="h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
      <div
        class="h-full bg-primary-500 transition-all duration-100"
        style="width: {progress}%"
      ></div>
    </div>
  </div>
  
  <div class="text-xs font-medium">
    {formatTime(currentTime)}/{formatTime(duration)}
  </div>
</div>