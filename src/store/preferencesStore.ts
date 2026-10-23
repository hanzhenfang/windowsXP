import { defineStore } from "pinia"

const STORAGE_KEY = "windows-xp-mock:preferences"
export type WallpaperId = "deskbg" | "desktop-background"
export type ThemeColor = "blue" | "olive" | "silver"
export type IconSize = "large" | "small"
export interface BrowserTabPreference { id: string; address: string; history: string[]; historyIndex: number }
interface PreferencesSnapshot {
  version: 1
  browserFavorites: string[]
  browserTabs: BrowserTabPreference[]
  activeBrowserTabId: string
  wallpaperId: WallpaperId
  soundEnabled: boolean
  soundVolume: number
  iconSize: IconSize
  themeColor: ThemeColor
}
const defaultFavorites = ["about:home", "http://windows-xp.local/", "http://blog.local/"]
const defaultBrowserTabs: BrowserTabPreference[] = [{ id: "ie-tab-1", address: "about:home", history: ["about:home"], historyIndex: 0 }]
const defaults: PreferencesSnapshot = {
  version: 1,
  browserFavorites: defaultFavorites,
  browserTabs: defaultBrowserTabs,
  activeBrowserTabId: "ie-tab-1",
  wallpaperId: "deskbg",
  soundEnabled: true,
  soundVolume: 0.35,
  iconSize: "large",
  themeColor: "blue",
}

function loadPreferences(): PreferencesSnapshot {
  const fallback = { ...defaults, browserFavorites: defaultFavorites.slice(), browserTabs: defaultBrowserTabs.map((tab) => ({ ...tab, history: tab.history.slice() })) }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<PreferencesSnapshot>
    if (value.version !== 1) return fallback
    return {
      version: 1,
      browserFavorites: Array.isArray(value.browserFavorites) && value.browserFavorites.every((favorite) => typeof favorite === "string") ? value.browserFavorites.slice() : fallback.browserFavorites,
      browserTabs: sanitizeBrowserTabs(value.browserTabs) ?? fallback.browserTabs,
      activeBrowserTabId: typeof value.activeBrowserTabId === "string" && sanitizeBrowserTabs(value.browserTabs)?.some((tab) => tab.id === value.activeBrowserTabId) ? value.activeBrowserTabId : (sanitizeBrowserTabs(value.browserTabs)?.[0]?.id ?? fallback.activeBrowserTabId),
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

function sanitizeBrowserTabs(value: unknown): BrowserTabPreference[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  const tabs: BrowserTabPreference[] = []
  for (const entry of value.slice(0, 12)) {
    if (!entry || typeof entry !== "object") return undefined
    const tab = entry as Partial<BrowserTabPreference>
    if (typeof tab.id !== "string" || typeof tab.address !== "string" || !Array.isArray(tab.history) || tab.history.length === 0 || !tab.history.every((item) => typeof item === "string") || typeof tab.historyIndex !== "number" || !Number.isInteger(tab.historyIndex)) return undefined
    const historyIndex = Math.max(0, Math.min(tab.history.length - 1, tab.historyIndex))
    tabs.push({ id: tab.id, address: tab.address, history: tab.history.slice(-100), historyIndex: Math.min(historyIndex, Math.min(tab.history.length, 100) - 1) })
  }
  return tabs
}

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({ snapshot: loadPreferences() }),
  getters: {
    browserFavorites: (state) => state.snapshot.browserFavorites,
    browserTabs: (state) => state.snapshot.browserTabs,
    activeBrowserTabId: (state) => state.snapshot.activeBrowserTabId,
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
    setBrowserSession(tabs: BrowserTabPreference[], activeBrowserTabId: string) {
      const safeTabs = sanitizeBrowserTabs(tabs)
      if (!safeTabs?.length) return
      this.snapshot.browserTabs = safeTabs
      this.snapshot.activeBrowserTabId = safeTabs.some((tab) => tab.id === activeBrowserTabId) ? activeBrowserTabId : safeTabs[0].id
      this.persist()
    },
    setWallpaper(wallpaperId: WallpaperId) { this.snapshot.wallpaperId = wallpaperId; this.persist() },
    setSoundEnabled(soundEnabled: boolean) { this.snapshot.soundEnabled = soundEnabled; this.persist() },
    setSoundVolume(soundVolume: number) { this.snapshot.soundVolume = Math.min(1, Math.max(0, soundVolume)); this.persist() },
    setIconSize(iconSize: IconSize) { this.snapshot.iconSize = iconSize; this.persist() },
    setThemeColor(themeColor: ThemeColor) { this.snapshot.themeColor = themeColor; this.persist() },
  },
})
