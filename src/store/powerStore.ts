import { defineStore } from "pinia"

export type PowerStatus = "running" | "shutting-down" | "sleeping" | "restarting" | "logged-off"

export const usePowerStore = defineStore("power", {
  state: () => ({ status: "running" as PowerStatus, dialogOpen: false }),
  actions: {
    openDialog() { this.dialogOpen = true },
    closeDialog() { this.dialogOpen = false },
    setStatus(status: PowerStatus) { this.status = status },
    wake() { this.status = "running" },
  },
})
