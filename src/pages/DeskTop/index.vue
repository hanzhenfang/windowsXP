<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from "vue"
import { useRootStore } from "@/store/rootStore"
import { storeToRefs } from "pinia"

import DesktopShell from "@/components/desktop/DesktopShell.vue"


const rootStore = useRootStore()
const { isMobile } = storeToRefs(rootStore)

let stopResizeListener: (() => void) | undefined

onMounted(() => {
  stopResizeListener = rootStore.initStore()
})

const isMobileLayout = computed(() => isMobile.value)
onBeforeUnmount(() => stopResizeListener?.())
</script>
<template>
  <DesktopShell :mobile="isMobileLayout" />
</template>
