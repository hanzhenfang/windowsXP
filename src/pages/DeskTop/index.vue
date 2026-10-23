<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from "vue"
import { useRootStore } from "@/store/rootStore"
import { storeToRefs } from "pinia"

import PCDeskTop from "@/pages/DeskTop/PCDeskTop/index.vue"
import MobileDeskTop from "@/pages/DeskTop/MobileDeskTop/index.vue"


const rootStore = useRootStore()
const { isMobile } = storeToRefs(rootStore)

let stopResizeListener: (() => void) | undefined

onMounted(() => {
  stopResizeListener = rootStore.initStore()
})

const desktopComponent = computed(() => isMobile.value ? MobileDeskTop : PCDeskTop)
onBeforeUnmount(() => stopResizeListener?.())
</script>
<template>
  <Component :is="desktopComponent" />
</template>
