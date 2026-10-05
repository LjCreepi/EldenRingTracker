// Polyfills for running unit tests under jsdom (the default Vitest environment).

// Newer Node (26+) exposes an experimental native `localStorage` global that is
// inert without `--localstorage-file` and shadows jsdom's working one, so bare
// `localStorage.*` calls in specs throw. Point the global at jsdom's Storage
// (falling back to an in-memory shim) so the tests don't depend on the Node
// version the CI image happens to ship.
function localStorageWorks(candidate: unknown): candidate is Storage {
  try {
    (candidate as Storage).setItem('__probe__', '1');
    (candidate as Storage).removeItem('__probe__');
    return true;
  } catch {
    return false;
  }
}

if (!localStorageWorks(globalThis.localStorage)) {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    key: (i) => [...store.keys()][i] ?? null,
  };
  const replacement =
    typeof window !== 'undefined' && localStorageWorks(window.localStorage)
      ? window.localStorage
      : shim;
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      value: replacement,
      configurable: true,
      writable: true,
    });
  } catch {
    // Property is locked down — nothing more we can do here.
  }
}

// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
