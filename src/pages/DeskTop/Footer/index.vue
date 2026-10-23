<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRootStore } from "@/store/rootStore"
import { useWindowStore } from "@/store/windowStore"
import { desktopApps } from "@/apps/manifest"
import WindowsLogo from "@/assets/windowsXP.png"
import ShieldIcon from "@/assets/systemIcon/安全卫士.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"

const rootStore = useRootStore()
const windows = useWindowStore()
const nowTime = ref(new Date())
const isStartOpen = ref(false)
const isMobile = computed(() => rootStore.isMobile)
let timer = 0
const timeText = computed(() => nowTime.value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
onMounted(() => { timer = window.setInterval(() => { nowTime.value = new Date() }, 1000) })
onBeforeUnmount(() => window.clearInterval(timer))

function openFromStart(id: string) {
  windows.openApp(id)
  isStartOpen.value = false
}
</script>

<template>
  <div class="xp-taskbar" :class="{ 'xp-taskbar-mobile': isMobile }">
    <Transition name="start-menu">
      <div v-if="isStartOpen" class="xp-start-menu">
        <div class="xp-start-user"><img src="@/assets/avatar.jpg" /><b>韩振方</b></div>
        <div class="xp-start-apps">
          <button v-for="app in desktopApps" :key="app.id" @click="openFromStart(app.id)"><img :src="app.icon" /><span>{{ app.title }}</span></button>
        </div>
        <div class="xp-start-bottom"><span>所有程序　›</span><button @click="isStartOpen = false">关闭</button></div>
      </div>
    </Transition>
    <button class="xp-start-button" :class="{ active: isStartOpen }" @click.stop="isStartOpen = !isStartOpen"><img :src="WindowsLogo" /><span>开始</span></button>
    <div class="xp-task-items">
      <button v-for="item in windows.windows" :key="item.id" :class="{ active: windows.activeWindowId === item.id && !item.minimized }" @click="item.minimized || windows.activeWindowId !== item.id ? windows.focusWindow(item.id) : windows.minimizeWindow(item.id)"><img :src="item.icon" /><span>{{ item.title }}</span></button>
    </div>
    <div class="xp-tray"><img :src="ShieldIcon" /><img :src="NetworkIcon" /><time>{{ timeText }}</time></div>
  </div>
</template>
