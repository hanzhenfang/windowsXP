<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue"
import IconGroup from "@/pages/DeskTop/IconGroup/index.vue"
import Footer from "@/pages/DeskTop/Footer/index.vue"
import AppWindow from "@/components/Window/AppWindow.vue"
import { useWindowStore } from "@/store/windowStore"
import { useSystemAudio } from "@/composables/useSystemAudio"
import DeskBg from "@/assets/deskbg.jpg"
import LoginAudio from "@/assets/audio/login.mp3"

const store = useWindowStore()
const audio = ref<HTMLAudioElement>()
const { play } = useSystemAudio()
const contextMenu = ref<{ x: number; y: number } | null>(null)
function handleContextMenu(event: MouseEvent) {
  const desktop = document.getElementById("PCDesktop")
  if (!desktop?.contains(event.target as Node)) return
  event.preventDefault()
  const bounds = desktop.getBoundingClientRect()
  contextMenu.value = { x: Math.max(0, Math.min(event.clientX - bounds.left, bounds.width - 190)), y: Math.max(0, Math.min(event.clientY - bounds.top, bounds.height - 205)) }
}
function closeContextMenu() { contextMenu.value = null }
onMounted(() => {
  document.addEventListener("contextmenu", handleContextMenu)
  document.addEventListener("click", closeContextMenu)
  play(audio.value)
})
onBeforeUnmount(() => {
  document.removeEventListener("contextmenu", handleContextMenu)
  document.removeEventListener("click", closeContextMenu)
})
</script>

<template>
  <div id="PCDesktop" class="xp-desktop" :style="{ backgroundImage: `url(${DeskBg})` }" @pointerdown.self="store.activeWindowId = null" @click.self="closeContextMenu">
    <IconGroup />
    <TransitionGroup name="xp-window-transition">
      <AppWindow v-for="window in store.visibleWindows" :key="window.id" :window="window" :mobile="false" />
    </TransitionGroup>
    <div v-if="contextMenu" class="xp-context-menu" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <button @click="closeContextMenu">查看(V)　›</button>
      <button @click="closeContextMenu">排列图标方式(O)　›</button>
      <button @click="closeContextMenu">刷新(E)</button>
      <hr />
      <button disabled>粘贴(P)</button>
      <hr />
      <button @click="closeContextMenu">新建(W)　›</button>
      <button @click="closeContextMenu">属性(R)</button>
    </div>
    <Footer />
    <audio ref="audio" :src="LoginAudio" preload="auto"></audio>
  </div>
</template>
