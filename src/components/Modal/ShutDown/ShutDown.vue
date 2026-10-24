<script lang="ts" setup>
import type { PowerAction } from "./types"
import { onMounted, ref } from "vue"

withDefaults(defineProps<{
  closeModal?: () => void
  onAction?: (action: PowerAction) => void
  mobile?: boolean
}>(), { mobile: false })

const actions: Array<{ id: PowerAction; title: string; description: string }> = [
  { id: "standby", title: "待机", description: "暂时关闭显示" },
  { id: "shutdown", title: "关闭计算机", description: "结束本次演示" },
  { id: "restart", title: "重新启动", description: "重新播放启动过程" },
]
const dialogRoot = ref<HTMLDivElement>()
onMounted(() => dialogRoot.value?.focus())
</script>

<template>
  <div ref="dialogRoot" class="power-dialog-backdrop" @click.self="closeModal?.()" @keydown.esc.stop="closeModal?.()" tabindex="-1">
    <section class="power-dialog" :class="{ 'power-dialog-mobile': mobile }" role="dialog" aria-modal="true" aria-labelledby="power-dialog-title" @click.stop>
      <header class="power-dialog-titlebar">
        <span id="power-dialog-title">关闭计算机</span>
        <img src="@/assets/windowsXP.png" alt="Windows XP" />
      </header>
      <p class="power-dialog-copy">选择一个电源选项。此页面会模拟操作，不会关闭或重启真实计算机。</p>
      <div class="power-dialog-actions">
        <button v-for="action in actions" :key="action.id" type="button" @click="onAction?.(action.id)">
          <span class="power-action-icon" aria-hidden="true">
            <svg v-if="action.id === 'standby'" viewBox="0 0 24 24" focusable="false"><path d="M19.5 4.5a8.4 8.4 0 1 0 0 15 9.6 9.6 0 0 1 0-15Z" /></svg>
            <svg v-else-if="action.id === 'shutdown'" viewBox="0 0 24 24" focusable="false"><path d="M12 3.5v8" /><path d="M7 6.6a8.2 8.2 0 1 0 10 0" /></svg>
            <svg v-else viewBox="0 0 24 24" focusable="false"><path d="M20 7v5h-5" /><path d="M19 12a7.5 7.5 0 1 1-2.1-5.2L20 9" /></svg>
          </span>
          <span><b>{{ action.title }}</b><small>{{ action.description }}</small></span>
        </button>
      </div>
      <footer class="power-dialog-footer">
        <button type="button" class="power-cancel" @click="closeModal?.()">取消</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.power-dialog-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 2rem; background: #0007; z-index: 30000; }
.power-dialog { width: min(52rem, 94vw); overflow: hidden; border: 1px solid #0d2b75; border-radius: .7rem .7rem .3rem .3rem; background: #e9effa; color: #172d50; box-shadow: 0 1rem 4rem #0008; font: 1.35rem/1.4 Tahoma, "Microsoft YaHei", sans-serif; }
.power-dialog-titlebar { display: flex; align-items: center; justify-content: space-between; min-height: 4.8rem; padding: .5rem 1.5rem; color: #fff; background: linear-gradient(90deg,#083c9c,#4387e4 58%,#1550b0); font-size: 1.8rem; font-weight: 700; text-shadow: 1px 1px #163c7b; }
.power-dialog-titlebar img { width: 3.6rem; height: 3.6rem; object-fit: contain; }
.power-dialog-copy { padding: 1.4rem 1.6rem .6rem; }
.power-dialog-actions { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .8rem; padding: 1rem 1.4rem 1.5rem; }
.power-dialog-actions button { min-height: 10rem; display: flex; align-items: center; gap: .8rem; padding: .8rem; border: 1px solid transparent; border-radius: .4rem; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.power-dialog-actions button:hover, .power-dialog-actions button:focus-visible { border-color: #8eaddb; background: #d8e6f8; outline: none; }
.power-action-icon { flex: 0 0 3.2rem; width: 3.2rem; height: 3.2rem; display: flex; align-items: center; justify-content: center; border: 2px solid white; border-radius: .6rem; background: linear-gradient(#62a2ed,#1760bf); color: #fff; box-shadow: 0 1px 3px #23487588; line-height: 0; }
.power-action-icon svg { display: block; flex: none; width: 2.15rem; height: 2.15rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.power-action-icon svg:first-child path:first-child { fill: none; }
.power-dialog-actions b, .power-dialog-actions small { display: block; }
.power-dialog-actions b { font-size: 1.35rem; }
.power-dialog-actions small { margin-top: .3rem; color: #556b89; font-size: 1.05rem; }
.power-dialog-footer { display: flex; justify-content: flex-end; padding: .8rem 1.4rem; border-top: 1px solid #c6d4e8; background: #dbe5f3; }
.power-cancel { min-width: 8rem; padding: .5rem 1.2rem; border: 1px solid #8798ad; border-radius: .3rem; background: linear-gradient(#fff,#e0e4e9); color: #26394f; cursor: pointer; }
.power-cancel:focus-visible { outline: 2px solid #1259aa; outline-offset: 2px; }
@media (max-width: 600px) { .power-dialog-actions { grid-template-columns: 1fr; gap: .2rem; padding: .5rem 1rem 1rem; } .power-dialog-actions button { min-height: 6rem; } .power-dialog-actions button span:last-child { flex: 1; } }
</style>
