<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from "vue"
import { useRootStore } from "@/store/rootStore"
import { storeToRefs } from "pinia"
import { useWindowStore } from "@/store/windowStore"

import PCDeskTop from "@/pages/DeskTop/PCDeskTop/index.vue"
import MobileDeskTop from "@/pages/DeskTop/MobileDeskTop/index.vue"


const rootStore = useRootStore()
const { isMobile } = storeToRefs(rootStore)
const windows = useWindowStore()

let stopResizeListener: (() => void) | undefined
let stopPersistListener: (() => void) | undefined
let persistTimer = 0

onMounted(() => {
  stopResizeListener = rootStore.initStore()
  window.addEventListener("resize", windows.resizeForViewport, { passive: true })
  windows.persist()
  stopPersistListener = windows.$subscribe(() => {
    window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(() => windows.persist(), 250)
  })
})

const desktopComponent = computed(() => isMobile.value ? MobileDeskTop : PCDeskTop)
onBeforeUnmount(() => {
  stopResizeListener?.()
  window.removeEventListener("resize", windows.resizeForViewport)
  stopPersistListener?.()
  window.clearTimeout(persistTimer)
  windows.persist()
})
</script>
<template>
  <Component :is="desktopComponent" />
</template>
