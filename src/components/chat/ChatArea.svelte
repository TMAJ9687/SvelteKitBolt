<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { MoreVertical, X as CloseIcon, Send, Image as ImageIcon, Smile, Globe, Trash2, Inbox, Clock } from 'lucide-svelte';
  import InboxModal from './InboxModal.svelte';
  import BlockedUsersModal from './BlockedUsersModal.svelte';
  import ImagePreview from './ImagePreview.svelte';
  import ImageViewer from './ImageViewer.svelte';
  import SharedMediaModal from './SharedMediaModal.svelte';
  import DeleteChatModal from './DeleteChatModal.svelte';
  import ReportModal from '../ReportModal.svelte';
  import { handleBotResponse } from '$lib/bots';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { firestore, storage } from '$lib/firebase';
  import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch, getDoc, getDocs } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { v4 as uuidv4 } from 'uuid';
  import toast from 'svelte-french-toast';
  import type { ImageUploadState } from '$lib/types/chat';

  export let currentUser;
  export let selectedUser;
  export let onClose: () => void = () => {};

  let messages = [];
  let newMessage = '';
  let messagesContainer;
  let unsubscribe = null;
  let loading = false;
  let showUserMenu = false;
  let showImagePreview = false;
  let showEmojiPicker = false;
  let showSharedMedia = false;
  let showDeleteChat = false;
  let showReportModal = false;
  let selectedImage: File | null = null;
  let selectedImageUrl: string | null = null;
  let uploadingImage = false;
  let imageInput: HTMLInputElement;
  let emojiPickerContainer: HTMLDivElement;
  let imageUploadState: ImageUploadState = {
    dailyUploads: 0,
    lastUploadDate: ''
  };

  // NEW: Modal controls
  let showInboxModal = false;
  let showBlockedUsersModal = false;

  const dispatch = createEventDispatcher();

  $: characterLimit = currentUser?.isVip ? 200 : 120;
  $: characterCount = newMessage.length;
  $: isOverLimit = characterCount > characterLimit;
  $: isBlocked = selectedUser && currentUser.blockedUsers?.includes(selectedUser.uid);

  function openInbox() {
    showInboxModal = true;
  }

  function openBlockedUsers() {
    showBlockedUsersModal = true;
    showUserMenu = false;
  }

  function openHistory() {
    toast('History modal coming soon!', {icon: '🕓'});
  }

  onMount(async () => {
    if (selectedUser) {
      loadMessages();
      await loadImageUploadState();
    }
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  async function loadImageUploadState() {
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(firestore, 'profiles', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const data = userDoc.data();

    if (data?.lastPhotoReset !== today) {
      imageUploadState = {
        dailyUploads: 0,
        lastUploadDate: today
      };
    } else {
      imageUploadState = {
        dailyUploads: data?.dailyPhotoCount || 0,
        lastUploadDate: data?.lastPhotoReset
      };
    }
  }

  async function updateImageUploadCount() {
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(firestore, 'profiles', currentUser.uid);

    await updateDoc(userRef, {
      dailyPhotoCount: imageUploadState.dailyUploads + 1,
      lastPhotoReset: today
    });

    imageUploadState = {
      dailyUploads: imageUploadState.dailyUploads + 1,
      lastUploadDate: today
    };
  }

  async function handleBlock() {
    try {
      const currentUserRef = doc(firestore, 'profiles', currentUser.uid);
      const targetUserRef = doc(firestore, 'profiles', selectedUser.uid);

      await Promise.all([
        updateDoc(currentUserRef, {
          blockedUsers: arrayUnion(selectedUser.uid)
        }),
        updateDoc(targetUserRef, {
          blockedUsers: arrayUnion(currentUser.uid)
        })
      ]);

      toast.success(`Blocked ${selectedUser.nickname}`);
      showUserMenu = false;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  }

  async function handleUnblock() {
    try {
      const currentUserRef = doc(firestore, 'profiles', currentUser.uid);
      const targetUserRef = doc(firestore, 'profiles', selectedUser.uid);

      await Promise.all([
        updateDoc(currentUserRef, {
          blockedUsers: arrayRemove(selectedUser.uid)
        }),
        updateDoc(targetUserRef, {
          blockedUsers: arrayRemove(currentUser.uid)
        })
      ]);

      toast.success(`Unblocked ${selectedUser.nickname}`);
      showUserMenu = false;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  }

  async function handleDeleteChat() {
    try {
      const batch = writeBatch(firestore);

      const q = query(
        collection(firestore, 'messages'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(docSnap => {
        const message = docSnap.data();
        if (message.participants.includes(selectedUser.uid)) {
          batch.delete(docSnap.ref);
        }
      });

      await batch.commit();
      showDeleteChat = false;
      onClose();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }

  function handleReportSubmit(event) {
    toast.success('Report submitted successfully');
    showReportModal = false;
  }

  function loadMessages() {
    if (unsubscribe) unsubscribe();
    loading = true;
    messages = [];
    const q = query(
      collection(firestore, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc')
    );
    unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg =>
          (msg.senderUid === currentUser.uid && msg.receiverUid === selectedUser?.uid) ||
          (msg.senderUid === selectedUser?.uid && msg.receiverUid === currentUser.uid)
        );
      messages = newMessages;
      loading = false;
      setTimeout(() => {
        if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    });
  }

  async function sendMessage(text = newMessage) {
    if (!selectedUser || (!text && !selectedImage) || isOverLimit) return;

    try {
      const messageData = {
        text: text.trim(),
        senderUid: currentUser.uid,
        receiverUid: selectedUser.uid,
        timestamp: new Date().toISOString(),
        participants: [currentUser.uid, selectedUser.uid]
      };

      await addDoc(collection(firestore, 'messages'), messageData);
      newMessage = '';

      if (selectedUser.isBot) {
        setTimeout(async () => {
          const botResponse = await handleBotResponse(selectedUser.uid, text);
          await addDoc(collection(firestore, 'messages'), {
            text: botResponse,
            senderUid: selectedUser.uid,
            receiverUid: currentUser.uid,
            timestamp: new Date().toISOString(),
            participants: [currentUser.uid, selectedUser.uid]
          });
        }, Math.random() * 1000 + 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !isOverLimit) {
      event.preventDefault();
      sendMessage();
    }
  }

  function handleInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    if (input.value.length > characterLimit) {
      input.value = input.value.slice(0, characterLimit);
      newMessage = input.value;
      toast.error(`Message limit of ${characterLimit} characters reached!`);
    }
  }

  async function handleImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Only JPEG, PNG and GIF images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    selectedImage = file;
    selectedImageUrl = URL.createObjectURL(file);
    showImagePreview = true;
  }

  async function handleImageUpload() {
    if (!selectedImage) return;
    uploadingImage = true;

    try {
      const imageRef = ref(storage, `chat-images/${currentUser.uid}/${uuidv4()}`);
      await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(firestore, 'messages'), {
        senderUid: currentUser.uid,
        receiverUid: selectedUser.uid,
        participants: [currentUser.uid, selectedUser.uid],
        timestamp: new Date().toISOString(),
        image: {
          url: imageUrl,
          blurred: true
        }
      });

      toast('Image will be deleted automatically after 1 hour.', { icon: '⏳' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      uploadingImage = false;
      showImagePreview = false;
      selectedImage = null;
      selectedImageUrl = null;
      if (imageInput) imageInput.value = '';
    }
  }

  function handleEmojiSelect(event: CustomEvent) {
    const emoji = event.detail.unicode;
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newMessage = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      textarea.focus();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    }
    showEmojiPicker = false;
  }

  function toggleEmojiPicker() {
    showEmojiPicker = !showEmojiPicker;
  }

  async function updateImageBlur(messageId: string, blurred: boolean) {
    try {
      const messageRef = doc(firestore, 'messages', messageId);
      await updateDoc(messageRef, {
        'image.blurred': blurred
      });
    } catch (error) {
      console.error('Error updating image blur:', error);
      toast.error('Failed to update image');
    }
  }
</script>

<style>
  .chat-header-thin {
    padding: 0.5rem 1rem 0.5rem 1rem;
    min-height: 48px;
    align-items: center;
    gap: 0.6rem;
  }
  .chat-header-avatar {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
    margin-right: 0.1rem;
  }
  .chat-header-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.01rem;
  }
  .chat-header-nickname {
    font-size: 1.02rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    line-height: 1.05;
  }
  .chat-header-detail {
    font-size: 0.96rem;
    color: #555;
    gap: 0.16rem;
    align-items: center;
    display: flex;
    line-height: 1;
    font-weight: 400;
  }
  .chat-header-vip {
    color: #ffbe26;
    margin-left: 0.06rem;
    margin-right: 0.14rem;
    font-size: 1.1em;
    vertical-align: middle;
  }
  .chat-header-actions {
    display: flex;
    align-items: center;
    gap: 0.18rem;
    margin-left: auto;
  }
  .input-counter {
    font-size: 0.89rem;
    color: #888;
    margin-right: 0.6rem;
    margin-top: 0.08rem;
    text-align: right;
  }
  .img-counter {
    font-size: 0.89rem;
    color: #888;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -1.12rem;
    background: rgba(255,255,255,0.97);
    border-radius: 7px;
    padding: 0 4px;
    pointer-events: none;
  }
</style>

<div class="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
  {#if !selectedUser}
    <div class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <p>Select a user to start chatting</p>
    </div>
  {:else}
    <!-- Compact Chat Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex chat-header-thin">
      <div class="chat-header-avatar rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold">
        {selectedUser.nickname[0].toUpperCase()}
      </div>
      <div class="chat-header-main flex-1">
        <span class="chat-header-nickname">
          {selectedUser.nickname}
          {#if selectedUser.isVip}
            <span class="chat-header-vip" title="VIP">👑</span>
            <span class="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded-full">VIP</span>
          {/if}
        </span>
        <span class="chat-header-detail">
          <span class={selectedUser.gender === 'Male' ? 'text-blue-600' : 'text-pink-500'}>
            {selectedUser.gender}
          </span>
          , {selectedUser.age}
          <span class="mx-1">|</span>
          <img 
            src="https://flagcdn.com/{selectedUser.countryCode}.svg" 
            alt="{selectedUser.country} flag"
            class="w-4 h-3 object-cover rounded ml-1"
          />
          <span>{selectedUser.country}</span>
        </span>
      </div>
      <div class="chat-header-actions">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Inbox"
          on:click={openInbox}
        >
          <Inbox size={20} />
        </button>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="History"
          on:click={openHistory}
        >
          <Clock size={20} />
        </button>
        <div class="relative">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            on:click={() => showUserMenu = !showUserMenu}
            title="More"
          >
            <MoreVertical size={20} />
          </button>
          {#if showUserMenu}
            <div 
              class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              use:clickOutside={() => showUserMenu = false}
            >
              <button
                class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={isBlocked ? handleUnblock : handleBlock}
              >
                {isBlocked ? 'Unblock User' : 'Block User'}
              </button>
              <button
                class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={() => { showReportModal = true; showUserMenu = false; }}
              >
                Report User
              </button>
              <button
                class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={openBlockedUsers}
              >
                Blocked Users
              </button>
              {#if currentUser.isVip}
                <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  on:click={() => { showSharedMedia = true; showUserMenu = false; }}
                >
                  <ImageIcon size={16} />
                  <span>Shared Media</span>
                </button>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  on:click={() => { toast('Translation coming soon!', {icon: '🌍'}); showUserMenu = false; }}
                >
                  <Globe size={16} />
                  <span>Translate Chat</span>
                </button>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  on:click={() => { showDeleteChat = true; showUserMenu = false; }}
                >
                  <Trash2 size={16} />
                  <span>Delete Chat</span>
                </button>
              {/if}
            </div>
          {/if}
        </div>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          on:click={onClose}
        >
          <CloseIcon size={20} />
        </button>
      </div>
    </div>

    <!-- Messages area -->
    <div class="flex-1 overflow-y-auto p-6" bind:this={messagesContainer}>
      {#if loading}
        <div class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        </div>
      {:else if messages.length === 0}
        <div class="flex justify-center py-4 text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each messages as message}
            {@const isSender = message.senderUid === currentUser.uid}
            <div class="flex {isSender ? 'justify-end' : 'justify-start'}">
              <div class="max-w-[70%]">
                <div class="mt-1">
                  <div class="group relative px-4 py-2 rounded-lg {isSender ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800'} shadow">
                    {#if message.text}
                      <p class="whitespace-pre-wrap">{message.text}</p>
                    {/if}
                    {#if message.image}
                      <ImageViewer 
                        imageUrl={message.image.url}
                        blurred={message.image.blurred}
                        on:blur={({ detail }) => updateImageBlur(message.id, detail.blurred)}
                      />
                    {/if}
                    <div class="text-xs mt-1 text-gray-400 flex items-center gap-1">
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {#if currentUser.isVip && isSender}
                        <span class="ml-1">
                          {#if message.status === 'read'}
                            <span class="text-primary-400">✓✓</span>
                          {:else if message.status === 'delivered'}
                            <span class="text-gray-400">✓✓</span>
                          {:else}
                            <span class="text-gray-400">✓</span>
                          {/if}
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Message input -->
    <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-3">
      {#if isBlocked}
        <div class="text-center text-gray-500 dark:text-gray-400 py-2">
          You cannot send messages to blocked users
        </div>
      {:else}
        <div class="flex items-end gap-2 relative">
          <button 
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            on:click={toggleEmojiPicker}
          >
            <Smile size={20} />
          </button>
          <textarea
            bind:value={newMessage}
            on:keypress={handleKeyPress}
            on:input={handleInput}
            placeholder="Type a message..."
            class="flex-1 bg-gray-50 rounded-lg p-2 resize-none border border-gray-200 focus:ring-primary-500"
            rows="1"
          ></textarea>
          <div class="relative flex flex-col items-center">
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/gif" 
              class="hidden" 
              bind:this={imageInput} 
              on:change={handleImageSelect}
            />
            <button 
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative" 
              on:click={() => imageInput.click()}
              title="Upload photo"
              disabled={!currentUser.isVip && imageUploadState.dailyUploads >= 10}
            >
              <ImageIcon size={20} />
            </button>
            {#if !currentUser.isVip}
              <span class="img-counter">{imageUploadState.dailyUploads}/10</span>
            {/if}
          </div>
          <button 
            class="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600" 
            on:click={() => sendMessage()}
            disabled={!newMessage.trim() || isOverLimit}
          >
            <Send size={20} />
          </button>
        </div>
        <div class="input-counter">{characterCount}/{characterLimit} characters</div>
        
        {#if showEmojiPicker}
          <div 
            class="absolute bottom-20 right-4 z-50"
            bind:this={emojiPickerContainer}
            use:clickOutside={() => showEmojiPicker = false}
          >
            <emoji-picker
              on:emoji-click={handleEmojiSelect}
            ></emoji-picker>
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if showInboxModal}
    <InboxModal 
      {currentUser}
      on:close={() => showInboxModal = false}
      on:selectChat={(e) => {
        dispatch('selectUser', e.detail);
        showInboxModal = false;
      }}
    />
  {/if}

  {#if showBlockedUsersModal}
    <BlockedUsersModal
      {currentUser}
      on:close={() => showBlockedUsersModal = false}
    />
  {/if}
</div>

{#if showImagePreview && selectedImageUrl}
  <ImagePreview
    imageUrl={selectedImageUrl}
    file={selectedImage}
    dailyUploads={!currentUser.isVip ? imageUploadState.dailyUploads : undefined}
    maxUploads={!currentUser.isVip ? 10 : undefined}
    isVip={currentUser.isVip}
    on:cancel={() => {
      showImagePreview = false;
      selectedImage = null;
      selectedImageUrl = null;
      if (imageInput) imageInput.value = '';
    }}
    on:send={handleImageUpload}
  />
{/if}

{#if showSharedMedia}
  <SharedMediaModal
    messages={messages.filter(m => m.image && !m.image.expired)}
    on:close={() => showSharedMedia = false}
  />
{/if}

{#if showDeleteChat}
  <DeleteChatModal
    nickname={selectedUser.nickname}
    on:close={() => showDeleteChat = false}
    on:confirm={handleDeleteChat}
  />
{/if}

{#if showReportModal}
  <ReportModal
    reportedUser={selectedUser}
    on:close={() => showReportModal = false}
    on:submit={handleReportSubmit}
  />
{/if}
