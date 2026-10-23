import { beforeEach, describe, expect, it } from "vitest"
import { FILESYSTEM_STORAGE_KEY, saveFilesystemSnapshot } from "@/mocks/filesystem/storage"
import { filesystemService } from "@/mocks/filesystem/service"
import type { FilesystemSnapshot } from "@/mocks/filesystem/types"

const snapshot: FilesystemSnapshot = {
  version: 1,
  entries: [
    { id: "root", parentId: null, name: "电脑", kind: "folder", type: "system-folder", size: 0, modifiedAt: 1, system: true },
    { id: "drive", parentId: "root", name: "C:", kind: "folder", type: "drive", size: 0, modifiedAt: 1, system: true },
    { id: "source", parentId: "drive", name: "项目", kind: "folder", type: "folder", size: 0, modifiedAt: 1 },
    { id: "nested", parentId: "source", name: "资料", kind: "folder", type: "folder", size: 0, modifiedAt: 1 },
    { id: "note", parentId: "nested", name: "说明.txt", kind: "file", type: "text/plain", size: 4, modifiedAt: 1, content: "test" },
    { id: "target", parentId: "drive", name: "目标", kind: "folder", type: "folder", size: 0, modifiedAt: 1 },
    { id: "empty", parentId: "drive", name: "空文件夹", kind: "folder", type: "folder", size: 0, modifiedAt: 1 },
    { id: "existing", parentId: "target", name: "项目", kind: "folder", type: "folder", size: 0, modifiedAt: 1 },
  ],
  recycleBin: [],
}

function currentSnapshot() {
  return JSON.parse(localStorage.getItem(FILESYSTEM_STORAGE_KEY) || "{}") as FilesystemSnapshot
}

describe("filesystem copy and move", () => {
  beforeEach(() => { saveFilesystemSnapshot(structuredClone(snapshot)) })

  it("copiesNestedFolderWithFreshIds", () => {
    const copied = filesystemService.copyEntries(["source"], "target")

    expect(copied).toHaveLength(3)
    expect(copied.every((entry) => !["source", "nested", "note"].includes(entry.id))).toBe(true)
    const current = currentSnapshot()
    const copiedRoot = copied.find((entry) => entry.parentId === "target")!
    const copiedFolder = copied.find((entry) => entry.parentId === copiedRoot.id)!
    expect(copiedRoot.name).toBe("项目 - 副本")
    expect(copiedFolder.name).toBe("资料")
    expect(copied.find((entry) => entry.parentId === copiedFolder.id)).toMatchObject({ name: "说明.txt", content: "test" })
    expect(current.entries).toHaveLength(snapshot.entries.length + 3)
  })

  it("normalizesAncestorAndDescendantSelection", () => {
    const moved = filesystemService.moveEntries(["source", "nested", "nested"], "empty")

    expect(moved).toHaveLength(3)
    expect(currentSnapshot().entries.find((entry) => entry.id === "source")?.parentId).toBe("empty")
    expect(currentSnapshot().entries.find((entry) => entry.id === "nested")?.parentId).toBe("source")
  })

  it("namesCopiesWithoutOverwrite", () => {
    const firstCopy = filesystemService.copyEntries(["source"], "target")
    const secondCopy = filesystemService.copyEntries(["source"], "target")

    expect(firstCopy.find((entry) => entry.parentId === "target")?.name).toBe("项目 - 副本")
    expect(secondCopy.find((entry) => entry.parentId === "target")?.name).toBe("项目 - 副本 (2)")
    expect(new Set(currentSnapshot().entries.filter((entry) => entry.parentId === "target").map((entry) => entry.name)).size).toBe(3)
  })

  it("rejectsMoveIntoDescendant", () => {
    const before = localStorage.getItem(FILESYSTEM_STORAGE_KEY)

    expect(() => filesystemService.moveEntries(["source"], "nested")).toThrow()
    expect(localStorage.getItem(FILESYSTEM_STORAGE_KEY)).toBe(before)
  })

  it("leavesSnapshotUnchangedAfterBatchConflict", () => {
    const before = localStorage.getItem(FILESYSTEM_STORAGE_KEY)

    expect(() => filesystemService.moveEntries(["source", "existing"], "target")).toThrow()
    expect(localStorage.getItem(FILESYSTEM_STORAGE_KEY)).toBe(before)
  })
})
