const MAX_SIZE = 500;

class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end for LRU ordering
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = 0) {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
    });
    if (this.store.size > MAX_SIZE) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
  }
}

module.exports = new Cache();
