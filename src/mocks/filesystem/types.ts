export interface MockEntry {
  id: string
  parentId: string | null
  name: string
  kind: "folder" | "file"
  type: string
  size: number
  modifiedAt: number
  content?: string
  assetUrl?: string
  system?: boolean
  /** Root folder ID that groups an item and its descendants in the Recycle Bin. */
  recycleGroupId?: string
  /** Original parent is retained on a recycled group root for restore. */
  originalParentId?: string | null
}

export interface FilesystemSnapshot {
  version: 1
  entries: MockEntry[]
  recycleBin: MockEntry[]
}

export class FilesystemOperationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FilesystemOperationError"
  }
}
