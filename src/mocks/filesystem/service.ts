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
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    const entry = entries.find((candidate) => candidate.id === id)
    if (!entry) continue
    result.push(entry)
    if (entry.kind === "folder") entries.filter((candidate) => candidate.parentId === id).forEach((child) => queue.push(child.id))
  }
  return result
}

function normalizeRoots(entries: MockEntry[], ids: string[]) {
  const selected = [...new Set(ids)]
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
  for (const id of selected) {
    const entry = entriesById.get(id)
    if (!entry) throw new FilesystemOperationError("所选项目已不存在。")
    if (entry.system || entry.parentId === null) throw new FilesystemOperationError("此系统项目不能复制或移动。")
  }
  const selectedSet = new Set(selected)
  return selected.filter((id) => {
    let parentId = entriesById.get(id)?.parentId ?? null
    const visited = new Set<string>()
    while (parentId !== null && !visited.has(parentId)) {
      if (selectedSet.has(parentId)) return false
      visited.add(parentId)
      parentId = entriesById.get(parentId)?.parentId ?? null
    }
    return true
  })
}

function getTarget(snapshot: FilesystemSnapshot, targetParentId: string) {
  const target = findEntry(snapshot, targetParentId)
  if (!target || target.kind !== "folder") throw new FilesystemOperationError("目标文件夹不存在。")
  return target
}

function getMoveRoots(snapshot: FilesystemSnapshot, ids: string[], targetParentId: string) {
  getTarget(snapshot, targetParentId)
  const rootIds = normalizeRoots(snapshot.entries, ids)
  const entriesById = new Map(snapshot.entries.map((entry) => [entry.id, entry]))
  const roots = rootIds.map((id) => entriesById.get(id)!)
  const names = new Set<string>()
  for (const root of roots) {
    let ancestorId: string | null = targetParentId
    const visited = new Set<string>()
    while (ancestorId !== null && !visited.has(ancestorId)) {
      if (ancestorId === root.id) throw new FilesystemOperationError("不能将文件夹移动到自身或其子文件夹中。")
      visited.add(ancestorId)
      ancestorId = entriesById.get(ancestorId)?.parentId ?? null
    }
    const normalizedName = root.name.toLocaleLowerCase()
    if (names.has(normalizedName)) throw new FilesystemOperationError("目标位置将出现重名项目。")
    names.add(normalizedName)
    ensureUniqueName(snapshot, targetParentId, root.name, root.parentId === targetParentId ? root.id : undefined)
  }
  return roots
}

function copyName(snapshot: FilesystemSnapshot, parentId: string, sourceName: string, reservedNames: Set<string>) {
  const taken = (name: string) => reservedNames.has(name.toLocaleLowerCase()) || snapshot.entries.some((entry) => entry.parentId === parentId && entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())
  const base = `${sourceName} - 副本`
  if (!taken(base)) return base
  let suffix = 2
  while (taken(`${base} (${suffix})`)) suffix += 1
  return `${base} (${suffix})`
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
  copyEntries(ids: string[], targetParentId: string): MockEntry[] {
    const snapshot = this.load()
    getTarget(snapshot, targetParentId)
    const rootIds = normalizeRoots(snapshot.entries, ids)
    if (!rootIds.length) return []
    const reservedNames = new Set<string>()
    const idMap = new Map<string, string>()
    const copied: MockEntry[] = []
    const roots = rootIds.map((id) => findEntry(snapshot, id)!)
    for (const root of roots) {
      const subtree = collectSubtree(snapshot.entries, root.id)
      for (const entry of subtree) idMap.set(entry.id, createId())
      const rootName = copyName(snapshot, targetParentId, root.name, reservedNames)
      reservedNames.add(rootName.toLocaleLowerCase())
      for (const entry of subtree) {
        const isRoot = entry.id === root.id
        copied.push({
          ...entry,
          id: idMap.get(entry.id)!,
          parentId: isRoot ? targetParentId : idMap.get(entry.parentId!) ?? entry.parentId,
          name: isRoot ? rootName : entry.name,
          system: false,
          modifiedAt: Date.now(),
          recycleGroupId: undefined,
          originalParentId: undefined,
          deletedAt: undefined,
        })
      }
    }
    snapshot.entries.push(...copied)
    save(snapshot)
    return copied.map((entry) => ({ ...entry }))
  },
  moveEntries(ids: string[], targetParentId: string): MockEntry[] {
    const snapshot = this.load()
    const roots = getMoveRoots(snapshot, ids, targetParentId)
    if (!roots.length) return []
    const moved: MockEntry[] = []
    for (const root of roots) {
      root.parentId = targetParentId
      root.modifiedAt = Date.now()
      moved.push(...collectSubtree(snapshot.entries, root.id).map((entry) => ({ ...entry })))
    }
    save(snapshot)
    return moved
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
