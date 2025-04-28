import type { ChatUser } from '$lib/types/chat';

// Bot responses based on interests and personality
const botResponses = {
  gaming: [
    "Have you played any good games lately?",
    "What's your favorite game genre?",
    "I love both indie and AAA games. You?",
    "PC or console gaming? I'm curious!",
  ],
  music: [
    "What kind of music do you enjoy?",
    "I've been listening to a lot of indie lately.",
    "Do you play any instruments?",
    "Music is such a universal language, isn't it?",
  ],
  tech: [
    "What's your take on AI?",
    "Have you tried any cool new tech recently?",
    "I'm fascinated by emerging technologies!",
    "What tech trends are you following?",
  ],
  art: [
    "Do you have a favorite art style?",
    "I love exploring different forms of creative expression.",
    "Digital or traditional art? Both are amazing!",
    "Art has such power to move people, don't you think?",
  ],
  general: [
    "How's your day going?",
    "That's interesting! Tell me more.",
    "What do you like to do for fun?",
    "I'd love to hear your thoughts on that!",
    "Have you been anywhere interesting lately?",
  ]
};

// Define bot profiles
export const bots: ChatUser[] = [
  {
    uid: 'bot_1',
    nickname: 'Luna',
    gender: 'Female',
    age: 24,
    country: 'Japan',
    countryCode: 'jp',
    interests: ['Gaming', 'Technology'],
    isVip: true,
    isBot: true,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    uid: 'bot_2',
    nickname: 'Alex',
    gender: 'Male',
    age: 28,
    country: 'Canada',
    countryCode: 'ca',
    interests: ['Music', 'Art'],
    isVip: false,
    isBot: true,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    uid: 'bot_3',
    nickname: 'Sofia',
    gender: 'Female',
    age: 22,
    country: 'Italy',
    countryCode: 'it',
    interests: ['Art', 'Travel'],
    isVip: true,
    isBot: true,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    uid: 'bot_4',
    nickname: 'Marcus',
    gender: 'Male',
    age: 31,
    country: 'Germany',
    countryCode: 'de',
    interests: ['Technology', 'Sports'],
    isVip: false,
    isBot: true,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    uid: 'bot_5',
    nickname: 'Zara',
    gender: 'Female',
    age: 26,
    country: 'Brazil',
    countryCode: 'br',
    interests: ['Music', 'Dance'],
    isVip: true,
    isBot: true,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

// Get a random response based on interests
function getRandomResponse(interests: string[]): string {
  const interestLower = interests[Math.floor(Math.random() * interests.length)].toLowerCase();
  const responsePool = botResponses[interestLower as keyof typeof botResponses] || botResponses.general;
  return responsePool[Math.floor(Math.random() * responsePool.length)];
}

// Simulate bot typing delay
function getTypingDelay(): number {
  return Math.floor(Math.random() * 1000) + 500; // 500-1500ms delay
}

export async function handleBotResponse(botUid: string, userMessage: string): Promise<string> {
  const bot = bots.find(b => b.uid === botUid);
  if (!bot) throw new Error('Bot not found');
  
  // Simulate typing delay
  await new Promise(resolve => setTimeout(resolve, getTypingDelay()));
  
  return getRandomResponse(bot.interests);
}