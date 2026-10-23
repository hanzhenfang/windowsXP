<script lang="ts" setup>
import { ref } from "vue"
import { desktopApps } from "@/apps/manifest"
import { useWindowStore } from "@/store/windowStore"

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
const store = useWindowStore()
const selectedId = ref<string | null>(null)

function activate(id: string, event: MouseEvent) {
  selectedId.value = id
  if (props.mobile) {
    store.openApp(id)
    return
  }
  if (event.detail >= 2) store.openApp(id)
}
</script>

<template>
  <div class="desktop-icons" :class="{ 'desktop-icons-mobile': mobile }" @click.self="selectedId = null">
    <button v-for="item in desktopApps" :key="item.id" class="desktop-icon" :class="{ selected: selectedId === item.id }" @click.stop="activate(item.id, $event)" @keydown.enter="store.openApp(item.id)">
      <img :src="item.icon" :alt="item.title" draggable="false" />
      <span>{{ item.id === 'browser' ? 'IE浏览器' : item.title }}</span>
    </button>
  </div>
</template>
