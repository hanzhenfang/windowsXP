import { h, render, Ref, ref } from "vue"
import ShutDownModal from "./ShutDown.vue"
import type { PowerAction } from "./types"

export class ShutDownModalCreator {
  container: HTMLElement
  isShow: Ref<boolean>
  bodyEl: HTMLBodyElement
  appEl: HTMLDivElement
  closeModal: () => void
  private grayscaleTimer: number | undefined
  constructor() {
    this.bodyEl = document.body as HTMLBodyElement
    this.appEl = document.getElementById("app") as HTMLDivElement
    this.container = document.createElement("div")
    this.closeModal = this.dismiss.bind(this)
    this.isShow = ref<boolean>(false)
  }

  present(onAction?: (action: PowerAction) => void) {
    if (this.isShow.value) return
    const modal = h(ShutDownModal, { closeModal: this.closeModal, onAction })
    render(modal, this.container)
    this.bodyEl.insertBefore(this.container, document.body.firstChild!)
    this.isShow.value = true
    this.bodyEl.addEventListener("click", this.closeModal)

    let scaleValue = 0
    this.grayscaleTimer = window.setInterval(() => {
      if (scaleValue > 50) {
        if (this.grayscaleTimer !== undefined) window.clearInterval(this.grayscaleTimer)
        this.grayscaleTimer = undefined
        return
      }
      scaleValue = scaleValue + 15
      if (this.appEl) this.appEl.style.filter = `grayscale(${scaleValue}%)`
    }, 200)
  }

  dismiss() {
    if (this.container && this.isShow.value) {
      if (this.grayscaleTimer !== undefined) {
        window.clearInterval(this.grayscaleTimer)
        this.grayscaleTimer = undefined
      }
      render(null, this.container)
      if (this.container.parentNode === document.body) document.body.removeChild(this.container)
      this.isShow.value = false
      if (this.appEl) this.appEl.style.filter = "grayscale(0)"
      document.body?.removeEventListener("click", this.closeModal)
    }
  }
}
