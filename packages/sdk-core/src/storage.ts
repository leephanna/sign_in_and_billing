export type TokenStore = {
  get(): string | null;
  set(token: string | null): void;
};

export function createBrowserTokenStore(key = "harmonia_token"): TokenStore {
  return {
    get() {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    },
    set(token) {
      if (typeof window === "undefined") return;
      if (!token) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, token);
    },
  };
}

export function createMemoryTokenStore(): TokenStore {
  let t: string | null = null;
  return { get: () => t, set: (x) => (t = x) };
}
