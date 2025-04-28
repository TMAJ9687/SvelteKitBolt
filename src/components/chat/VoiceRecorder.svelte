<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { Mic, Square, Send, X } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let isRecording = false;
  let recordingTime = 0;
  let timer: number;
  let audioBlob: Blob | null = null;
  let audioUrl: string | null = null;
  let audioElement: HTMLAudioElement;
  
  const MAX_DURATION = 90; // 90 seconds
  
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        audioUrl = URL.createObjectURL(audioBlob);
        audioChunks = [];
      };
      
      audioChunks = [];
      mediaRecorder.start();
      isRecording = true;
      recordingTime = 0;
      
      timer = window.setInterval(() => {
        recordingTime++;
        if (recordingTime >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      dispatch('error', 'Could not access microphone');
    }
  }
  
  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      clearInterval(timer);
      isRecording = false;
    }
  }
  
  function cancelRecording() {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    audioUrl = null;
    audioBlob = null;
    dispatch('cancel');
  }
  
  function sendRecording() {
    if (audioBlob) {
      dispatch('send', { blob: audioBlob, duration: recordingTime });
      cancelRecording();
    }
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  onDestroy(() => {
    if (timer) clearInterval(timer);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (mediaRecorder && isRecording) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  });
</script>

<div class="flex items-center gap-2">
  {#if !isRecording && !audioUrl}
    <button
      class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-500"
      on:click={startRecording}
      title="Record voice message"
    >
      <Mic size={20} />
    </button>
  {:else if isRecording}
    <div class="flex items-center gap-2 bg-primary-100 dark:bg-primary-900/20 rounded-full px-3 py-1">
      <div class="animate-pulse text-error-500">●</div>
      <span class="text-sm font-medium">{formatTime(recordingTime)}</span>
      <button
        class="p-1 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-full"
        on:click={stopRecording}
      >
        <Square size={16} />
      </button>
    </div>
  {:else if audioUrl}
    <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
      <audio bind:this={audioElement} src={audioUrl} preload="metadata" />
      <button
        class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
        on:click={() => audioElement.play()}
      >
        ▶️
      </button>
      <span class="text-sm font-medium">{formatTime(recordingTime)}</span>
      <div class="flex items-center gap-1">
        <button
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-error-500"
          on:click={cancelRecording}
        >
          <X size={16} />
        </button>
        <button
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-primary-500"
          on:click={sendRecording}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  {/if}
</div>