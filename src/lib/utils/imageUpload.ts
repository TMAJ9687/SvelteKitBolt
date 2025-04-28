export interface ImageUploadState {
  dailyUploads: number;
  lastUploadDate: string;
}

const MAX_DAILY_UPLOADS = 10;

export function checkDailyUploadLimit(state: ImageUploadState): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset counter if it's a new day
  if (state.lastUploadDate !== today) {
    return { 
      allowed: true, 
      remaining: MAX_DAILY_UPLOADS 
    };
  }
  
  const remaining = MAX_DAILY_UPLOADS - state.dailyUploads;
  return {
    allowed: remaining > 0,
    remaining
  };
}

export function updateUploadState(state: ImageUploadState): ImageUploadState {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset counter if it's a new day
  if (state.lastUploadDate !== today) {
    return {
      dailyUploads: 1,
      lastUploadDate: today
    };
  }
  
  return {
    dailyUploads: state.dailyUploads + 1,
    lastUploadDate: today
  };
}