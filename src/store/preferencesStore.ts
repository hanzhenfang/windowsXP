import { defineStore } from "pinia"

const STORAGE_KEY = "windows-xp-mock:preferences"
interface PreferencesSnapshot { version: 1; browserFavorites: string[] }
const defaultFavorites = ["about:home", "http://windows-xp.local/", "http://blog.local/"]

function loadPreferences(): PreferencesSnapshot {
  const fallback: PreferencesSnapshot = { version: 1, browserFavorites: defaultFavorites.slice() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<PreferencesSnapshot>
    if (value.version !== 1 || !Array.isArray(value.browserFavorites) || !value.browserFavorites.every((favorite) => typeof favorite === "string")) return fallback
    return { version: 1, browserFavorites: value.browserFavorites.slice() }
  } catch {
    return fallback
  }
}

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({ snapshot: loadPreferences() }),
  getters: { browserFavorites: (state) => state.snapshot.browserFavorites },
  actions: {
    persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot)) } catch { /* Preferences remain usable for this session if storage is blocked. */ }
    },
    addBrowserFavorite(address: string) {
      if (!this.snapshot.browserFavorites.includes(address)) this.snapshot.browserFavorites.push(address)
      this.persist()
    },
    removeBrowserFavorite(address: string) {
      this.snapshot.browserFavorites = this.snapshot.browserFavorites.filter((favorite) => favorite !== address)
      this.persist()
    },
  },
})
