export interface Message {
  id: string;
  senderUid: string;
  receiverUid: string;
  text?: string;
  timestamp: any;
  replyTo?: {
    id: string;
    text: string;
    senderUid: string;
  };
  image?: {
    url: string;
    thumbnail?: string;
    width: number;
    height: number;
    expired?: boolean;
    expiryTime?: any;
    blurred?: boolean;
  };
  audio?: {
    url: string;
    duration: number;
    expired?: boolean;
    expiryTime?: any;
  };
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatUser {
  uid: string;
  nickname: string;
  gender: string;
  age: number;
  country: string;
  countryCode: string;
  interests: string[];
  isVip: boolean;
  isBot?: boolean;
  isAdmin?: boolean;
  lastActive: any;
  createdAt: string;
  dailyPhotoCount?: number;
  lastPhotoReset?: string;
  blockedUsers?: string[];
  vipCreatedAt?: string;
}

export interface UserFilter {
  gender?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  countries?: string[];
  isActive?: boolean;
}

export interface ImageUploadState {
  dailyUploads: number;
  lastUploadDate: string;
}