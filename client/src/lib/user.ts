const USER_ID_KEY = 'dociq_user_id';

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    return 'server_environment';
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      userId = `user_${crypto.randomUUID()}`;
    } else {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}
