export type UnlockStatus = "idle" | "selected" | "entering" | "entered"

export interface UnlockFlow {
  readonly status: UnlockStatus
  select(): void
  deselect(): void
  begin(): boolean
  cancelEntry(): void
  complete(): void
}

export function createUnlockFlow(): UnlockFlow
