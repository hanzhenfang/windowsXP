<script lang="ts" setup>
import WindowsLogo from "@/assets/windowsXP.png"
import type { PowerDialogAction } from "./index"

defineProps<{ mobile: boolean }>()
const emit = defineEmits<{ (event: "action", action: PowerDialogAction): void }>()
const actions: { id: PowerDialogAction; icon: string; title: string; detail: string }[] = [
  { id: "standby", icon: "⏾", title: "待机", detail: "保存当前会话并进入待机。" },
  { id: "turn-off", icon: "⏻", title: "关闭", detail: "显示本地模拟的关机画面。" },
  { id: "restart", icon: "↻", title: "重新启动", detail: "重新进入 Windows 启动流程。" },
]
</script>
<template>
  <div class="xp-power-dialog-backdrop" @click.self="emit('action', 'cancel')">
    <section class="xp-power-dialog" :class="{ 'xp-power-dialog-mobile': mobile }" role="dialog" aria-modal="true" aria-label="关闭计算机">
      <header><span>关闭计算机</span><img :src="WindowsLogo" alt="Windows XP" /></header>
      <p>您要让计算机执行什么操作？</p>
      <div class="xp-power-options">
        <button v-for="item in actions" :key="item.id" @click="emit('action', item.id)">
          <span class="xp-power-option-icon">{{ item.icon }}</span>
          <span><b>{{ item.title }}</b><small>{{ item.detail }}</small></span>
        </button>
      </div>
      <footer><button @click="emit('action', 'cancel')">取消</button></footer>
    </section>
  </div>
</template>
