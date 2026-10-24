<script lang="ts" setup>
import { nextTick, ref, watch } from "vue"
const props = withDefaults(defineProps<{ modelValue: boolean; title: string; message: string; confirmText?: string }>(), { confirmText: "确定" })
const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void; (event: "confirm"): void }>()
const cancelButton = ref<HTMLButtonElement>()
function close() { emit("update:modelValue", false) }
function confirm() { close(); emit("confirm") }
watch(() => props.modelValue, async (visible) => { if (visible) { await nextTick(); cancelButton.value?.focus() } })
</script>

<template>
  <div v-if="modelValue" class="xp-dialog-backdrop" @click.self="close" @keydown.esc.stop="close">
    <section class="xp-dialog xp-confirm-dialog" role="alertdialog" aria-modal="true" :aria-label="title">
      <header class="xp-dialog-titlebar"><span>{{ title }}</span><button aria-label="关闭" @click="close">×</button></header>
      <div class="xp-dialog-content"><span class="xp-dialog-icon">❔</span><p class="xp-dialog-message">{{ message }}</p></div>
      <footer class="xp-dialog-actions"><button ref="cancelButton" @click="close">取消</button><button class="primary" @click="confirm">{{ confirmText }}</button></footer>
    </section>
  </div>
</template>
