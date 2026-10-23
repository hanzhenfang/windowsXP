<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRootStore } from "@/store/rootStore"
import { useWindowStore } from "@/store/windowStore"
import WindowsLogo from "@/assets/windowsXP.png"
import ShieldIcon from "@/assets/systemIcon/安全卫士.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"
import StartMenu from "./StartMenu.vue"

const emit = defineEmits<{ (event: "launch", appId: string): void; (event: "power"): void }>()
const windows = useWindowStore()
const root = useRootStore()
const isStartOpen = ref(false)
const now = ref(new Date())
const isMobile = computed(() => root.isMobile)
const timeText = computed(() => now.value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
let clockTimer = 0

onMounted(() => { clockTimer = window.setInterval(() => { now.value = new Date() }, 1000) })
function closeStartMenuOutside(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest(".xp-start-menu, .xp-start-button")) isStartOpen.value = false
}
function closeStartMenuOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") isStartOpen.value = false
}
onMounted(() => {
  document.addEventListener("click", closeStartMenuOutside)
  document.addEventListener("keydown", closeStartMenuOnEscape)
})
onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  document.removeEventListener("click", closeStartMenuOutside)
  document.removeEventListener("keydown", closeStartMenuOnEscape)
})

function toggleTaskWindow(id: string) {
  const item = windows.windows.find((candidate) => candidate.id === id)
  if (!item) return
  if (item.state === "minimized" || windows.activeWindowId !== id) windows.focus(id)
  else windows.minimize(id)
}
</script>

<template>
  <div class="xp-taskbar" :class="{ 'xp-taskbar-mobile': isMobile }">
    <Transition name="start-menu"><StartMenu v-if="isStartOpen" @launch="emit('launch', $event); isStartOpen = false" @power="emit('power'); isStartOpen = false" /></Transition>
    <button class="xp-start-button" :class="{ active: isStartOpen }" aria-label="开始" @click="isStartOpen = !isStartOpen"><img :src="WindowsLogo" /><span>开始</span></button>
    <div class="xp-task-items">
      <button v-for="item in windows.taskbarWindows" :key="item.id" :class="{ active: windows.activeWindowId === item.id && item.state !== 'minimized' }" :title="item.title" @click="toggleTaskWindow(item.id)"><img :src="item.icon" /><span>{{ item.title }}</span></button>
    </div>
    <div class="xp-tray" title="系统托盘">
      <img :src="ShieldIcon" alt="安全中心" />
      <img :src="NetworkIcon" alt="网络连接" />
      <time>{{ timeText }}</time>
    </div>
  </div>
</template>
