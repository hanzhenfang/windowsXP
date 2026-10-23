import { copyFilesystemSnapshot, loadFilesystemSnapshot, saveFilesystemSnapshot } from "./storage"
import type { FilesystemSnapshot, MockEntry } from "./types"
import { FilesystemOperationError } from "./types"

let nextId = 0

function createId() {
  nextId += 1
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${nextId}`
  return `item-${random}`
}

function validateName(name: string) {
  const normalized = name.trim()
  const reservedDosName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(normalized)
  if (!normalized || /[<>:"/\\|?*\u0000-\u001f]/.test(normalized) || /[. ]$/.test(normalized) || normalized === "." || normalized === ".." || reservedDosName) {
    throw new FilesystemOperationError("请输入有效的名称。")
  }
  return normalized
}

function findEntry(snapshot: FilesystemSnapshot, id: string) {
  return snapshot.entries.find((entry) => entry.id === id)
}

function ensureUniqueName(snapshot: FilesystemSnapshot, parentId: string, name: string, exceptId?: string) {
  const duplicate = snapshot.entries.some((entry) => entry.parentId === parentId && entry.id !== exceptId && entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())
  if (duplicate) throw new FilesystemOperationError("此位置已存在同名项目。")
}

function collectSubtree(entries: MockEntry[], rootId: string) {
  const result: MockEntry[] = []
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    const entry = entries.find((candidate) => candidate.id === id)
    if (!entry) continue
    result.push(entry)
    if (entry.kind === "folder") entries.filter((candidate) => candidate.parentId === id).forEach((child) => queue.push(child.id))
  }
  return result
}

function save(snapshot: FilesystemSnapshot) {
  return saveFilesystemSnapshot(snapshot)
}

export const filesystemService = {
  load(): FilesystemSnapshot {
    return copyFilesystemSnapshot(loadFilesystemSnapshot())
  },
  list(parentId: string): MockEntry[] {
    return this.load().entries.filter((entry) => entry.parentId === parentId).sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name, "zh-CN") : a.kind === "folder" ? -1 : 1)
  },
  createFolder(parentId: string, name: string): MockEntry {
    const snapshot = this.load()
    const parent = findEntry(snapshot, parentId)
    if (!parent || parent.kind !== "folder") throw new FilesystemOperationError("目标文件夹不存在。")
    const safeName = validateName(name)
    ensureUniqueName(snapshot, parentId, safeName)
    const entry: MockEntry = { id: createId(), parentId, name: safeName, kind: "folder", type: "folder", size: 0, modifiedAt: Date.now() }
    snapshot.entries.push(entry)
    save(snapshot)
    return { ...entry }
  },
  createFile(parentId: string, name: string, content: string): MockEntry {
    const snapshot = this.load()
    const parent = findEntry(snapshot, parentId)
    if (!parent || parent.kind !== "folder") throw new FilesystemOperationError("目标文件夹不存在。")
    const safeName = validateName(name)
    ensureUniqueName(snapshot, parentId, safeName)
    const entry: MockEntry = { id: createId(), parentId, name: safeName, kind: "file", type: "text/plain", size: new Blob([content]).size, modifiedAt: Date.now(), content }
    snapshot.entries.push(entry)
    save(snapshot)
    return { ...entry }
  },
  rename(id: string, name: string): void {
    const snapshot = this.load()
    const entry = findEntry(snapshot, id)
    if (!entry || entry.system || entry.parentId === null) throw new FilesystemOperationError("此系统项目不能重命名。")
    const safeName = validateName(name)
    ensureUniqueName(snapshot, entry.parentId, safeName, id)
    entry.name = safeName
    entry.modifiedAt = Date.now()
    save(snapshot)
  },
  moveToRecycleBin(id: string): void {
    const snapshot = this.load()
    const root = findEntry(snapshot, id)
    if (!root || root.system || root.parentId === null) throw new FilesystemOperationError("此系统项目不能删除。")
    const originalParentId = root.parentId
    const deletedAt = Date.now()
    const subtree = collectSubtree(snapshot.entries, id)
    const subtreeIds = new Set(subtree.map((entry) => entry.id))
    snapshot.entries = snapshot.entries.filter((entry) => !subtreeIds.has(entry.id))
    snapshot.recycleBin.push(...subtree.map((entry) => entry.id === id
      ? { ...entry, recycleGroupId: id, originalParentId, deletedAt }
      : { ...entry, recycleGroupId: id, deletedAt }))
    save(snapshot)
  },
  restore(id: string): void {
    const snapshot = this.load()
    const root = snapshot.recycleBin.find((entry) => entry.id === id && entry.recycleGroupId === id)
    if (!root || root.originalParentId === undefined || root.originalParentId === null) throw new FilesystemOperationError("找不到可还原的项目。")
    const parent = findEntry(snapshot, root.originalParentId)
    if (!parent || parent.kind !== "folder") throw new FilesystemOperationError("原始位置不可用。")
    ensureUniqueName(snapshot, parent.id, root.name)
    const group = snapshot.recycleBin.filter((entry) => entry.recycleGroupId === id)
    snapshot.recycleBin = snapshot.recycleBin.filter((entry) => entry.recycleGroupId !== id)
    snapshot.entries.push(...group.map((entry) => {
      const { recycleGroupId: _recycleGroupId, originalParentId: _originalParentId, deletedAt: _deletedAt, ...rest } = entry
      return entry.id === id ? { ...rest, parentId: root.originalParentId! } : rest
    }))
    save(snapshot)
  },
  permanentlyDelete(id: string): void {
    const snapshot = this.load()
    const item = snapshot.recycleBin.find((entry) => entry.id === id)
    if (!item) throw new FilesystemOperationError("找不到要删除的项目。")
    const groupId = item.recycleGroupId ?? item.id
    snapshot.recycleBin = snapshot.recycleBin.filter((entry) => entry.recycleGroupId !== groupId && entry.id !== id)
    save(snapshot)
  },
  emptyRecycleBin(): void {
    const snapshot = this.load()
    snapshot.recycleBin = []
    save(snapshot)
  },
  read(id: string): MockEntry | undefined {
    const snapshot = this.load()
    const entry = snapshot.entries.find((candidate) => candidate.id === id) ?? snapshot.recycleBin.find((candidate) => candidate.id === id)
    return entry ? { ...entry } : undefined
  },
}
