type Listener = (v: boolean) => void;

const listeners = new Set<Listener>();

export const subscribe = (cb: Listener) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const emit = (v: boolean) => {
  listeners.forEach((cb) => cb(v));
};

export const hasListeners = () => listeners.size > 0;
