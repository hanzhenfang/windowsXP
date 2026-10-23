import { defineStore } from "pinia"
import { filesystemService } from "@/mocks/filesystem/service"
import type { FilesystemSnapshot, MockEntry } from "@/mocks/filesystem/types"

export const useFilesystemStore = defineStore("filesystem", {
  state: () => ({ snapshot: filesystemService.load() as FilesystemSnapshot }),
  getters: {
    entries: (state) => state.snapshot.entries,
    recycleBinEntries: (state) => state.snapshot.recycleBin.filter((entry) => entry.recycleGroupId === entry.id),
    entryById: (state) => (id: string) => state.snapshot.entries.find((entry) => entry.id === id),
    childrenOf: (state) => (parentId: string) => state.snapshot.entries.filter((entry) => entry.parentId === parentId),
  },
  actions: {
    refresh() { this.snapshot = filesystemService.load() },
    createFolder(parentId: string, name: string) { const entry = filesystemService.createFolder(parentId, name); this.refresh(); return entry },
    createFile(parentId: string, name: string, content: string) { const entry = filesystemService.createFile(parentId, name, content); this.refresh(); return entry },
    rename(id: string, name: string) { filesystemService.rename(id, name); this.refresh() },
    moveToRecycleBin(id: string) { filesystemService.moveToRecycleBin(id); this.refresh() },
    restore(id: string) { filesystemService.restore(id); this.refresh() },
    permanentlyDelete(id: string) { filesystemService.permanentlyDelete(id); this.refresh() },
    emptyRecycleBin() { filesystemService.emptyRecycleBin(); this.refresh() },
    read(id: string): MockEntry | undefined { return filesystemService.read(id) },
  },
})
