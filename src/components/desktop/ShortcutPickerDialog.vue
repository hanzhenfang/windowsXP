<script lang="ts" setup>
import { ref, watch, nextTick } from "vue"
import { desktopApps } from "@/apps/manifest"

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: "update:modelValue", visible: boolean): void; (event: "confirm", appId: string): void }>()
const selectedAppId = ref("browser")
const select = ref<HTMLSelectElement>()

watch(() => props.modelValue, async (visible) => {
  if (visible) {
    selectedAppId.value = "browser"
    await nextTick()
    select.value?.focus()
  }
})

function close() { emit("update:modelValue", false) }
function confirm() { emit("confirm", selectedAppId.value); close() }
</script>

<template>
  <div v-if="modelValue" class="xp-dialog-backdrop" @click.self="close" @keydown.esc.stop="close">
    <section class="xp-dialog xp-shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="xp-shortcut-title">
      <header class="xp-dialog-titlebar"><span id="xp-shortcut-title">创建快捷方式</span><button aria-label="关闭" @click="close">×</button></header>
      <div class="xp-dialog-content"><span class="xp-dialog-icon">🪄</span><div class="xp-dialog-message"><p>请选择要在桌面创建快捷方式的程序：</p><label>程序<select ref="select" v-model="selectedAppId"><option v-for="app in desktopApps" :key="app.id" :value="app.id">{{ app.title }}</option></select></label></div></div>
      <footer class="xp-dialog-actions"><button @click="close">取消</button><button class="primary" @click="confirm">完成</button></footer>
    </section>
  </div>
</template>
