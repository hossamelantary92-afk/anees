// Storage can be unavailable in private browsing, embedded views, or file URLs.
export const storage = {
  getItem(key: string): string | null { try { return window.localStorage.getItem(key); } catch { return null; } },
  setItem(key: string, value: string): void { try { window.localStorage.setItem(key, value); } catch { /* Session remains usable. */ } },
};
