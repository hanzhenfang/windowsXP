import { beforeEach, describe, expect, it } from "vitest"
import { createLocalBackup, restoreLocalBackup, validateLocalBackup, type LocalBackup } from "@/mocks/backup"
import { FILESYSTEM_STORAGE_KEY } from "@/mocks/filesystem/storage"

const DESKTOP_KEY = "windows-xp-mock:desktop-shortcuts"
const PREFERENCES_KEY = "windows-xp-mock:preferences"
const SYSTEM_KEY = "windows-xp-mock:system"

const backupFixture: LocalBackup = {
  version: 1,
  filesystem: {
    version: 1,
    entries: [
      { id: "root", parentId: null, name: "电脑", kind: "folder", type: "system-folder", size: 0, modifiedAt: 1, system: true },
      { id: "folder", parentId: "root", name: "文档", kind: "folder", type: "folder", size: 0, modifiedAt: 2 },
      { id: "file", parentId: "folder", name: "说明.txt", kind: "file", type: "text/plain", size: 4, modifiedAt: 3, content: "本地" },
    ],
    recycleBin: [],
  },
  desktop: { version: 2, titles: { browser: "本地浏览器" }, hidden: [], custom: [], iconPositions: {}, sortMode: "manual", recentApps: ["browser"] },
  preferences: { version: 1, browserFavorites: ["about:home"], browserTabs: [{ id: "tab-1", address: "about:home", history: ["about:home"], historyIndex: 0 }], activeBrowserTabId: "tab-1", wallpaperId: "desktop-background", soundEnabled: false, soundVolume: 0.6, iconSize: "small", themeColor: "silver" },
  system: { version: 1, network: { connected: false } },
}

function seedStorage() {
  localStorage.setItem(FILESYSTEM_STORAGE_KEY, JSON.stringify(backupFixture.filesystem))
  localStorage.setItem(DESKTOP_KEY, JSON.stringify(backupFixture.desktop))
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(backupFixture.preferences))
  localStorage.setItem(SYSTEM_KEY, JSON.stringify(backupFixture.system))
}

describe("local backup validation and restore", () => {
  beforeEach(() => localStorage.clear())

  it("roundTripsAllLocalStores", () => {
    seedStorage()
    const backup = createLocalBackup()
    localStorage.clear()

    restoreLocalBackup(backup)

    expect(JSON.parse(localStorage.getItem(FILESYSTEM_STORAGE_KEY)!)).toEqual(backupFixture.filesystem)
    expect(JSON.parse(localStorage.getItem(DESKTOP_KEY)!)).toEqual(backupFixture.desktop)
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual(backupFixture.preferences)
    expect(JSON.parse(localStorage.getItem(SYSTEM_KEY)!)).toEqual(backupFixture.system)
  })

  it("rejectsUnknownBackupVersion", () => {
    expect(() => validateLocalBackup({ ...backupFixture, version: 9 })).toThrow()
  })

  it("rejectsDuplicateFilesystemIds", () => {
    const duplicate = structuredClone(backupFixture)
    duplicate.filesystem.entries.push({ ...duplicate.filesystem.entries[1] })
    expect(() => validateLocalBackup(duplicate)).toThrow()
  })

  it("rejectsMissingParent", () => {
    const missingParent = structuredClone(backupFixture)
    missingParent.filesystem.entries[1].parentId = "not-there"
    expect(() => validateLocalBackup(missingParent)).toThrow()
  })

  it("rejectsRecycleBinEntryWithNonFolderParent", () => {
    const invalid = structuredClone(backupFixture)
    invalid.filesystem.recycleBin = [
      { id: "recycled-root", parentId: "file", name: "已删除.txt", kind: "file", type: "text/plain", size: 1, modifiedAt: 4, deletedAt: 5, recycleGroupId: "recycled-root", originalParentId: "folder" },
    ]

    expect(() => validateLocalBackup(invalid)).toThrow()
  })

  it("rejectsRecycleBinParentCycle", () => {
    const invalid = structuredClone(backupFixture)
    invalid.filesystem.recycleBin = [
      { id: "recycled-root", parentId: "recycled-child", name: "已删除目录", kind: "folder", type: "folder", size: 0, modifiedAt: 4, deletedAt: 5, recycleGroupId: "recycled-root", originalParentId: "folder" },
      { id: "recycled-child", parentId: "recycled-root", name: "子项.txt", kind: "file", type: "text/plain", size: 1, modifiedAt: 4, deletedAt: 5, recycleGroupId: "recycled-root" },
    ]

    expect(() => validateLocalBackup(invalid)).toThrow()
  })

  it("rejectsRecycleBinEntryWithoutGroupRoot", () => {
    const invalid = structuredClone(backupFixture)
    invalid.filesystem.recycleBin = [
      { id: "orphan", parentId: "folder", name: "已删除.txt", kind: "file", type: "text/plain", size: 1, modifiedAt: 4, deletedAt: 5, recycleGroupId: "missing-root" },
    ]

    expect(() => validateLocalBackup(invalid)).toThrow()
  })

  it("invalidImportDoesNotChangeStorage", () => {
    seedStorage()
    const before = Object.fromEntries([FILESYSTEM_STORAGE_KEY, DESKTOP_KEY, PREFERENCES_KEY, SYSTEM_KEY].map((key) => [key, localStorage.getItem(key)]))
    const invalid = structuredClone(backupFixture) as LocalBackup
    invalid.filesystem.entries[2].parentId = "missing"

    expect(() => restoreLocalBackup(invalid)).toThrow()
    expect(Object.fromEntries([FILESYSTEM_STORAGE_KEY, DESKTOP_KEY, PREFERENCES_KEY, SYSTEM_KEY].map((key) => [key, localStorage.getItem(key)]))).toEqual(before)
  })
})
