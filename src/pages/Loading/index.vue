<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

// Tune these values to change the POST-style startup pacing and transcript.
const lineDelayMs = 230
const characterDelayMs = 9
const logs = [
  "PhoenixBIOS 4.0 Release 6.0",
  "Copyright 1985-2001 Phoenix Technologies Ltd.",
  "CPU: Intel Pentium III processor detected",
  "Memory Test: 655360K OK",
  "Detecting IDE drives ... Primary Master: WDC WD800BB",
  "Detecting IDE drives ... Secondary Master: ATAPI CD-ROM",
  "Initializing USB controllers ... Done",
  "Loading Windows XP kernel ...",
  "Loading system drivers ...",
  "Starting Windows graphical subsystem ...",
]

const router = useRouter()
const output = ref<string[]>([])
const currentLine = ref("")
const isSkipping = ref(false)
const cursor = computed(() => "_")
let cancelled = false
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function skipBoot() {
  if (isSkipping.value) return
  isSkipping.value = true
  cancelled = true
  void router.replace({ name: "password" })
}

async function boot() {
  for (const line of logs) {
    if (cancelled) return
    currentLine.value = ""
    for (const char of line) {
      if (cancelled) return
      currentLine.value += char
      await wait(characterDelayMs)
    }
    output.value.push(currentLine.value)
    currentLine.value = ""
    await wait(lineDelayMs)
  }
  await wait(450)
  if (!cancelled) router.replace({ name: "password" })
}

onMounted(boot)
onBeforeUnmount(() => { cancelled = true })
</script>

<template>
  <main class="xp-boot-screen" aria-label="Windows XP 正在启动">
    <div class="xp-boot-log" aria-live="polite">
      <div v-for="(line, index) in output" :key="index">{{ line }}</div>
      <div v-if="currentLine">{{ currentLine }}{{ cursor }}</div>
    </div>
    <div class="xp-boot-brand"><span class="xp-boot-mark">▰</span><span>Microsoft<small>Windows XP</small></span></div>
    <div class="xp-boot-progress"><i v-for="n in 7" :key="n"></i></div>
    <button class="xp-boot-skip" type="button" :disabled="isSkipping" @click="skipBoot">
      {{ isSkipping ? "正在进入登录界面…" : "跳过启动　›" }}
    </button>
  </main>
</template>

<style scoped>
.xp-boot-screen { position: relative; width: 100%; height: 100%; overflow: hidden; padding: 2.4rem; background: #000; color: #b7ffb7; font: 1.35rem/1.55 "Lucida Console", Monaco, monospace; }
.xp-boot-log { max-height: 68%; overflow: hidden; white-space: pre-wrap; text-shadow: 0 0 5px #4cff4c; }
.xp-boot-brand { position: absolute; left: 50%; top: 72%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 1rem; color: #e7e7e7; font: italic 2.4rem/1 Tahoma, sans-serif; text-shadow: 0 0 12px #559bff; }
.xp-boot-brand small { display: block; margin-top: .6rem; color: #a9c7ff; font: 1.2rem Tahoma, sans-serif; text-align: right; }
.xp-boot-mark { color: #ef6b22; font-size: 3.6rem; }
.xp-boot-progress { position: absolute; left: 50%; bottom: 8%; display: flex; gap: .4rem; transform: translateX(-50%); }
.xp-boot-progress i { width: 1rem; height: 1rem; border-radius: .2rem; background: #4f8fe9; box-shadow: 0 0 8px #347be1; animation: boot-pulse 1s ease-in-out infinite alternate; }
.xp-boot-progress i:nth-child(2n) { animation-delay: .18s; }
.xp-boot-skip { position: absolute; right: 2.4rem; bottom: 2rem; padding: .7rem 1.1rem; border: 1px solid #91b5e8; border-radius: .4rem; background: linear-gradient(#477fc7, #174c91); color: #fff; font: 1.3rem Tahoma, "Microsoft YaHei", sans-serif; cursor: pointer; box-shadow: 0 2px 8px #0008; }
.xp-boot-skip:hover:not(:disabled) { background: linear-gradient(#6196dc, #2462ad); }
.xp-boot-skip:focus-visible { outline: 2px solid #ffe879; outline-offset: 3px; }
.xp-boot-skip:disabled { opacity: .75; cursor: wait; }
@keyframes boot-pulse { from { opacity: .25; transform: translateY(0); } to { opacity: 1; transform: translateY(-.3rem); } }
@media (prefers-reduced-motion: reduce) { .xp-boot-progress i { animation: none; } }
</style>
