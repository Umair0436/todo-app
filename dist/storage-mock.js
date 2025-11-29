window.storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value) {
      return { key, value, shared: false };
    }
    return null;
  },
  
  async set(key, value, shared = false) {
    localStorage.setItem(key, value);
    return { key, value, shared };
  },
  
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  
  async list(prefix = '') {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    return { keys, prefix };
  }
};