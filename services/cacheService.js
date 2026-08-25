class CacheService {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 1800) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.store.clear();
  }

  startCleanup(intervalSeconds = 300) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
        }
      }
    }, intervalSeconds * 1000);
  }
}

module.exports = new CacheService();