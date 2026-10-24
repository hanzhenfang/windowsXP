import { defineStore } from "pinia"

interface RootState {
  isMobile: boolean
}

export const useRootStore = defineStore("root", {
  state: (): RootState => ({ isMobile: typeof window === "undefined" ? false : window.innerWidth <= 768 }),
  actions: {
    initStore() {
      // Keep the experience tied to the available viewport, not a stale UA guess.
      const update = () => { this.isMobile = window.innerWidth <= 768 }
      update()
      window.addEventListener("resize", update, { passive: true })
      return () => window.removeEventListener("resize", update)
    },
  },
})
