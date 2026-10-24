<script lang="ts" setup>
import { nextTick, ref, watch } from "vue"

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  mode?: "input" | "confirm" | "message"
  initialValue?: string
  confirmText?: string
  cancelText?: string
}>(), {
  mode: "message",
  initialValue: "",
  confirmText: "确定",
  cancelText: "取消",
})
const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void; (event: "confirm", value: string): void }>()
const value = ref("")
const input = ref<HTMLInputElement>()

watch(() => props.modelValue, async (visible) => {
  if (!visible) return
  value.value = props.initialValue
  await nextTick()
  input.value?.focus()
  input.value?.select()
})

function close() { emit("update:modelValue", false) }
function confirm() {
  const submittedValue = value.value
  close()
  emit("confirm", submittedValue)
}
</script>

<template>
  <div v-if="modelValue" class="xp-dialog-backdrop" @click.self="close" @keydown.esc.stop="close" @keydown.enter.stop="mode !== 'message' && confirm()">
    <section class="xp-dialog" role="dialog" aria-modal="true" :aria-label="title">
      <header class="xp-dialog-titlebar"><span>{{ title }}</span><button aria-label="关闭" @click="close">×</button></header>
      <div class="xp-dialog-content">
        <span class="xp-dialog-icon">{{ mode === 'confirm' ? '❔' : mode === 'input' ? '📁' : 'ℹ️' }}</span>
        <div class="xp-dialog-message"><p>{{ message }}</p><input v-if="mode === 'input'" ref="input" v-model="value" aria-label="项目名称" maxlength="64" @keydown.enter.stop.prevent="confirm" /></div>
      </div>
      <footer class="xp-dialog-actions">
        <button v-if="mode !== 'message'" @click="close">{{ cancelText }}</button>
        <button class="primary" @click="confirm">{{ confirmText }}</button>
      </footer>
    </section>
  </div>
</template>
