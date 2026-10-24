import { defineStore } from "pinia"

export const SYSTEM_STORAGE_KEY = "windows-xp-mock:system"
interface SharedFile { id: string; name: string; type: string; content: string }
interface SharedFolder { id: string; name: string; files: SharedFile[] }
interface SharedComputer { id: string; name: string; description: string; shares: SharedFolder[] }
export interface SystemSnapshot {
  version: 1
  network: { connected: boolean }
}

const sharedComputers: SharedComputer[] = [
  {
    id: "office-pc", name: "OFFICE-PC", description: "办公室计算机", shares: [
      { id: "office-documents", name: "共享文档", files: [
        { id: "share-meeting-notes", name: "会议记录.txt", type: "text/plain", content: "本地共享示例文件。\n\n内容仅用于展示 Windows XP 网络邻居的本地模拟。" },
        { id: "share-project-readme", name: "项目说明.txt", type: "text/plain", content: "示例项目说明：所有网络邻居内容均为本地 mock 数据。" },
      ] },
      { id: "office-public", name: "Public", files: [
        { id: "share-public-message", name: "欢迎.txt", type: "text/plain", content: "欢迎访问本地共享文件夹。" },
      ] },
    ],
  },
  {
    id: "media-pc", name: "MEDIA-PC", description: "家庭媒体计算机", shares: [
      { id: "media-library", name: "媒体库", files: [
        { id: "share-music-list", name: "音乐清单.txt", type: "text/plain", content: "1. 夏日微风\n2. 绿野仙踪\n3. 蓝色天空" },
      ] },
    ],
  },
]

export function loadSystemSnapshot(): SystemSnapshot {
  const fallback: SystemSnapshot = { version: 1, network: { connected: true } }
  try {
    const raw = localStorage.getItem(SYSTEM_STORAGE_KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<SystemSnapshot>
    if (value.version !== 1 || !value.network || typeof value.network.connected !== "boolean") return fallback
    return { version: 1, network: { connected: value.network.connected } }
  } catch {
    return fallback
  }
}

export const useSystemStore = defineStore("system", {
  state: () => ({ snapshot: loadSystemSnapshot(), sharedComputers: sharedComputers.map((computer) => ({ ...computer, shares: computer.shares.map((share) => ({ ...share, files: share.files.map((file) => ({ ...file })) })) })) }),
  getters: {
    networkConnected: (state) => state.snapshot.network.connected,
    signalStrength: (state) => state.snapshot.network.connected ? 4 : 0,
    availableSharedComputers: (state) => state.snapshot.network.connected ? state.sharedComputers : [],
  },
  actions: {
    persist() {
      try { localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(this.snapshot)) } catch { /* Keep local network actions usable if storage is unavailable. */ }
    },
    reload() { this.snapshot = loadSystemSnapshot() },
    connect() { this.snapshot.network.connected = true; this.persist() },
    disconnect() { this.snapshot.network.connected = false; this.persist() },
    toggleConnection() { this.snapshot.network.connected = !this.snapshot.network.connected; this.persist() },
  },
})
