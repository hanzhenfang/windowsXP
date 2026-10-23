import { defineStore } from "pinia"

import { isMobile as detectMobile } from "@/utils/isMobile"

interface RootState {
  isMobile: boolean
}

export const useRootStore = defineStore("root", {
  state: (): RootState => ({ isMobile: typeof window === "undefined" ? false : detectMobile() }),
  actions: {
    initStore() {
      const update = () => { this.isMobile = detectMobile() || window.matchMedia("(max-width: 700px)").matches }
      update()
      window.addEventListener("resize", update, { passive: true })
      return () => window.removeEventListener("resize", update)
    },
  },
})
