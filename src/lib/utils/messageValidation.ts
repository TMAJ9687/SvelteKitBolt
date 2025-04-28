const STANDARD_MESSAGE_LIMIT = 120;
const VIP_MESSAGE_LIMIT = 200;
const STANDARD_CONSECUTIVE_NUMBERS = 3;
const VIP_CONSECUTIVE_LETTERS = 10;

// Regular expressions for validation
const PHONE_REGEX = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const CONSECUTIVE_NUMBERS_REGEX = /\d{4,}/;
const CONSECUTIVE_LETTERS_REGEX = /(.)\1{10,}/;

export function validateMessage(text: string, isVip: boolean): { isValid: boolean; error?: string } {
  // Check message length
  const maxLength = isVip ? VIP_MESSAGE_LIMIT : STANDARD_MESSAGE_LIMIT;
  if (text.length > maxLength) {
    return {
      isValid: false,
      error: `Message cannot exceed ${maxLength} characters;`
    };
  }

  // VIP users can post links and phone numbers
  if (!isVip) {
    if (PHONE_REGEX.test(text)) {
      return {
        isValid: false,
        error: 'Phone numbers are not allowed in messages'
      };
    }

    if (URL_REGEX.test(text)) {
      return {
        isValid: false,
        error: 'Links are not allowed in messages'
      };
    }

    if (CONSECUTIVE_NUMBERS_REGEX.test(text)) {
      return {
        isValid: false,
        error: `Maximum ${STANDARD_CONSECUTIVE_NUMBERS} consecutive numbers allowed`
      };
    }
  }

  // Check consecutive letters for VIP users
  if (isVip && CONSECUTIVE_LETTERS_REGEX.test(text)) {
    return {
      isValid: false,
      error: `Maximum ${VIP_CONSECUTIVE_LETTERS} consecutive same letters allowed`
    };
  }

  return { isValid: true };
}

export function checkMessageRateLimit(
  messageHistory: { timestamp: number }[],
  lastMessage: { text: string; timestamp: number; count: number } | null
): { allowed: boolean; error?: string } {
  const now = Date.now();
  
  // Clean up old messages (older than 60 seconds)
  const recentMessages = messageHistory.filter(msg => now - msg.timestamp < 60000);
  
  // Check rate limit: 10 messages per 10 seconds
  const last10Seconds = recentMessages.filter(msg => now - msg.timestamp < 10000);
  if (last10Seconds.length >= 10) {
    return {
      allowed: false,
      error: 'Message rate limit exceeded. Please wait a few seconds.'
    };
  }

  // Check duplicate message limit
  if (lastMessage && 
      lastMessage.text === lastMessage.text && 
      now - lastMessage.timestamp < 60000 && 
      lastMessage.count >= 3) {
    return {
      allowed: false,
      error: 'Cannot send the same message more than 3 times in a minute.'
    };
  }

  return { allowed: true };
}

export function formatMessageTimestamp(timestamp: any): string {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return '';
  }
  
  try {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
}