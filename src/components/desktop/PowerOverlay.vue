<script lang="ts" setup>
import { useRouter } from "vue-router"
import ShutDownDialog from "@/components/Modal/ShutDown/ShutDown.vue"
import type { PowerDialogAction } from "@/components/Modal/ShutDown"
import { usePowerStore } from "@/store/powerStore"
import { useWindowStore } from "@/store/windowStore"
import { useRootStore } from "@/store/rootStore"

const router = useRouter()
const power = usePowerStore()
const windows = useWindowStore()
const root = useRootStore()

function clearSessionWindows() {
  windows.windows = []
  windows.activeWindowId = null
}

function restart() {
  power.closeDialog()
  power.setStatus("restarting")
  clearSessionWindows()
  window.setTimeout(() => {
    power.setStatus("running")
    void router.replace({ name: "loading" })
  }, 850)
}

function handleAction(action: PowerDialogAction) {
  if (action === "cancel") { power.closeDialog(); return }
  power.closeDialog()
  if (action === "standby") power.setStatus("sleeping")
  if (action === "turn-off") power.setStatus("shutting-down")
  if (action === "restart") restart()
}

function wake() { power.setStatus("running") }
</script>

<template>
  <Teleport to="body">
    <div v-if="power.dialogOpen" class="xp-power-layer" @keydown.esc="power.closeDialog">
      <ShutDownDialog :mobile="root.isMobile" @action="handleAction" />
    </div>
    <div v-else-if="power.status === 'sleeping'" class="xp-power-sleep" @click="wake">
      <div class="xp-power-sleep-card"><span class="xp-power-sleep-icon">☾</span><h1>Windows 正在待机</h1><p>点击屏幕或按下任意位置以恢复会话。</p><button @click.stop="wake">恢复 Windows</button></div>
    </div>
    <div v-else-if="power.status === 'shutting-down'" class="xp-power-off">
      <img src="@/assets/windowsXP.png" alt="Windows XP" />
      <h1>Windows 已关闭</h1><p>此页面正在模拟计算机已关闭的状态。</p>
      <div><button @click="wake">重新唤醒</button><button @click="restart">重新启动</button></div>
    </div>
    <div v-else-if="power.status === 'restarting'" class="xp-power-restarting">
      <img src="@/assets/windowsXP.png" alt="" /><span>正在重新启动 Windows…</span><i></i>
    </div>
  </Teleport>
</template>
