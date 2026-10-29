type StorageName = 'localStorage' | 'sessionStorage';

export type SafeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * Web Storage that never throws. With cookies/site data blocked, merely
 * reading `window.localStorage` throws a SecurityError; values then live in an
 * in-memory copy for the page lifetime, so the current page keeps working but
 * nothing survives a reload.
 */
const createSafeStorage = (name: StorageName): SafeStorage => {
  const memory = new Map<string, string>();

  return {
    getItem(key) {
      try {
        const value = window[name].getItem(key);
        if (value !== null) return value;
      } catch {
        // Storage blocked: fall back to the in-memory copy.
      }
      return memory.get(key) ?? null;
    },
    setItem(key, value) {
      try {
        window[name].setItem(key, value);
        memory.delete(key);
      } catch {
        memory.set(key, value);
        // A failed write (e.g. quota) must not leave the older real value to
        // shadow the in-memory one on the next read.
        try {
          window[name].removeItem(key);
        } catch {
          // Storage blocked: nothing real to shadow it.
        }
      }
    },
    removeItem(key) {
      memory.delete(key);
      try {
        window[name].removeItem(key);
      } catch {
        // Storage blocked: only the in-memory copy existed.
      }
    },
  };
};

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');
