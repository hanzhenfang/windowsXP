import { defineStore } from "pinia"

const STORAGE_KEY = "windows-xp-mock:preferences"
export type WallpaperId = "deskbg" | "desktop-background"
export type ThemeColor = "blue" | "olive" | "silver"
export type IconSize = "large" | "small"
interface PreferencesSnapshot {
  version: 1
  browserFavorites: string[]
  wallpaperId: WallpaperId
  soundEnabled: boolean
  soundVolume: number
  iconSize: IconSize
  themeColor: ThemeColor
}
const defaultFavorites = ["about:home", "http://windows-xp.local/", "http://blog.local/"]
const defaults: PreferencesSnapshot = {
  version: 1,
  browserFavorites: defaultFavorites,
  wallpaperId: "deskbg",
  soundEnabled: true,
  soundVolume: 0.35,
  iconSize: "large",
  themeColor: "blue",
}

function loadPreferences(): PreferencesSnapshot {
  const fallback = { ...defaults, browserFavorites: defaultFavorites.slice() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<PreferencesSnapshot>
    if (value.version !== 1) return fallback
    return {
      version: 1,
      browserFavorites: Array.isArray(value.browserFavorites) && value.browserFavorites.every((favorite) => typeof favorite === "string") ? value.browserFavorites.slice() : fallback.browserFavorites,
      wallpaperId: value.wallpaperId === "desktop-background" ? "desktop-background" : "deskbg",
      soundEnabled: typeof value.soundEnabled === "boolean" ? value.soundEnabled : defaults.soundEnabled,
      soundVolume: typeof value.soundVolume === "number" && Number.isFinite(value.soundVolume) ? Math.min(1, Math.max(0, value.soundVolume)) : defaults.soundVolume,
      iconSize: value.iconSize === "small" ? "small" : "large",
      themeColor: value.themeColor === "olive" || value.themeColor === "silver" ? value.themeColor : "blue",
    }
  } catch {
    return fallback
  }
}

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({ snapshot: loadPreferences() }),
  getters: {
    browserFavorites: (state) => state.snapshot.browserFavorites,
    wallpaperId: (state) => state.snapshot.wallpaperId,
    soundEnabled: (state) => state.snapshot.soundEnabled,
    soundVolume: (state) => state.snapshot.soundVolume,
    iconSize: (state) => state.snapshot.iconSize,
    themeColor: (state) => state.snapshot.themeColor,
  },
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
    setWallpaper(wallpaperId: WallpaperId) { this.snapshot.wallpaperId = wallpaperId; this.persist() },
    setSoundEnabled(soundEnabled: boolean) { this.snapshot.soundEnabled = soundEnabled; this.persist() },
    setSoundVolume(soundVolume: number) { this.snapshot.soundVolume = Math.min(1, Math.max(0, soundVolume)); this.persist() },
    setIconSize(iconSize: IconSize) { this.snapshot.iconSize = iconSize; this.persist() },
    setThemeColor(themeColor: ThemeColor) { this.snapshot.themeColor = themeColor; this.persist() },
  },
})
