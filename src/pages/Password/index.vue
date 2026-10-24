<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"

import MobileLogin from "@/pages/Password/MobileLogin/index.vue"
import PCLogin from "@/pages/Password/PCLogin/index.vue"
import LoginFooter from "@/pages/Password/LoginFooter/index.vue"
import IconCombination from "@/components/IconCombination/index.vue"

import { useRootStore } from "@/store/rootStore"
import { usePowerStore } from "@/store/powerStore"
import { createUnlockFlow, type UnlockStatus } from "@/utils/unlockFlow.js"

// some options constants
const loadingDurationTime: number = 4000 // control IconCombination duration
//**************************************/

const rootStore = useRootStore()
const power = usePowerStore()
const { isMobile: detectedMobile } = storeToRefs(rootStore)
const { dialogOpen } = storeToRefs(power)
const isMobile = computed(() => detectedMobile.value)
const unlockFlow = createUnlockFlow()
const unlockStatus = ref<UnlockStatus>(unlockFlow.status)
let startupTimer = 0
let enterTimer = 0
let stopViewportListener: (() => void) | undefined

const router = useRouter()
const isLoading = ref<boolean>(true) // control before show avatar
const isLoginSuccess = computed(() => unlockStatus.value === "entering" || unlockStatus.value === "entered")

const isShowFooter = computed<boolean>(() => {
  return !isLoading.value
})

const closeBtnText = computed<string>(() => {
  return "关闭计算机"
})

function selectProfile() {
  if (!isMobile.value || isLoading.value) return
  unlockFlow.select()
  unlockStatus.value = unlockFlow.status
}

async function enterDesktop() {
  if (isLoading.value || dialogOpen.value || !unlockFlow.begin()) return
  unlockStatus.value = unlockFlow.status
  enterTimer = window.setTimeout(async () => {
    try {
      await router.replace({ name: "desktop" })
      if (router.currentRoute.value.name === "desktop") {
        power.setStatus("running")
        unlockFlow.complete()
        unlockStatus.value = unlockFlow.status
      } else {
        unlockFlow.cancelEntry()
        unlockStatus.value = unlockFlow.status
      }
    } catch {
      unlockFlow.cancelEntry()
      unlockStatus.value = unlockFlow.status
    }
  }, 320)
}

function hdlClickBackBtn() {
  if (unlockStatus.value === "entering" || unlockStatus.value === "entered") return
  if (dialogOpen.value) power.closeDialog()
  else power.openDialog()
}

function beforeHook() {
  startupTimer = window.setTimeout(() => { isLoading.value = false }, loadingDurationTime)
}

function skipStartupSplash() {
  if (!isLoading.value) return
  window.clearTimeout(startupTimer)
  isLoading.value = false
}

onMounted(() => {
  stopViewportListener = rootStore.initStore()
  beforeHook()
})
onBeforeUnmount(() => {
  stopViewportListener?.()
  window.clearTimeout(startupTimer)
  window.clearTimeout(enterTimer)
})
</script>
<template>
  <div
    id="root"
    class="xp-login-screen w-full h-full relative bg-blue"
  >
    <div
      class="xp-login-frame w-full h-full border-white border-y-0.2rem flex items-center justify-center"
    >
      <div v-if="isLoading" class="w-full h-full flex flex-col items-center">
        <div class="icon w-full h-full flex justify-center items-center">
          <IconCombination :winSize="7" />
        </div>
        <div>
          <span class="text-2rem font-600">Windows 正在启动. . .</span>
        </div>
        <button class="xp-login-skip" type="button" @click="skipStartupSplash">跳过启动　›</button>
      </div>

      <div v-else class="xp-login-main h-full">
        <div
          class="xp-login-brand flex flex-col items-center justify-center"
        >
          <div class="xp-login-logo">
            <IconCombination :companySize="1.5" :winSize="3" compact />
          </div>
          <div class="w-full text-right mt-1rem">
            <span class="xp-login-prompt">要开始，请单击您的用户名</span>
          </div>
        </div>

        <div class="xp-login-divider bg-white" aria-hidden="true"></div>

        <!-- The avatar content, there should distinguish PC and Mobile -->
        <div
          class="xp-login-user h-full flex flex-col items-center justify-center"
        >
          <div
            v-if="isMobile"
            class="w-full flex flex-col items-center justify-center"
          >
            <MobileLogin :selected="unlockStatus === 'selected'" :disabled="unlockStatus === 'entering' || unlockStatus === 'entered'" @select="selectProfile" @unlock="enterDesktop" />
          </div>

          <div v-else class="xp-login-form w-full flex items-center">
            <PCLogin :shutDownModal="dialogOpen" :disabled="unlockStatus === 'entering' || unlockStatus === 'entered'" @unlock="enterDesktop" />
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full absolute bottom-1rem flex justify-center px-10%"
      :style="[
        isLoginSuccess ? { opacity: 1 } : { opacity: 0 },
        { transition: 'all 1.5s' },
      ]"
    >
      <span
        class="font-600 text-2rem skew-x--25deg text-shadow-[1px_1px_3px_rgba(0,0,0,0.9)] flex-1 text-right"
      >
        欢迎使用
      </span>
    </div>

    <!-- footer content -->
    <LoginFooter
      :isShow="isShowFooter"
      :isLoginSuccess="isLoginSuccess"
      :closeBtnText="closeBtnText"
      :disabled="unlockStatus === 'entering' || unlockStatus === 'entered'"
      @clickCloseBtn="hdlClickBackBtn"
    />
  </div>
</template>

<style scoped>
.xp-login-screen { display: flex; flex-direction: column; height: 100vh; min-height: 42rem; overflow: hidden; padding: 13vh 0 16vh; background: #00349b; }
.xp-login-frame { position: relative; flex: 1 1 auto; width: 100%; height: auto; min-width: 0; min-height: 0; padding: 0 clamp(1.2rem, 4vw, 5rem); border-block: 1px solid #91b2f2; background: radial-gradient(ellipse at 9% 12%, #8eacec 0, #6988d8 20%, #5b7bd0 68%, #5978ca 100%); }
.xp-login-brand { min-width: 0; min-height: 0; padding: 0 clamp(1rem, 3vw, 3rem) 0 0; }
.xp-login-prompt { display: block; margin-top: 1.8rem; text-align: center; font-size: clamp(1.35rem, 1.8vw, 1.8rem); font-weight: 600; text-shadow: 0 1px 2px #254989; }
.xp-login-divider { width: 2px; height: 82%; align-self: center; background: linear-gradient(transparent, #9bb8f3 12%, #9bb8f3 88%, transparent); }
.xp-login-user { min-width: 0; min-height: 0; padding-left: clamp(1rem, 3vw, 3rem); }
.xp-login-form { min-width: 0; }
.xp-login-main { display: grid; grid-template-columns: minmax(0, 1fr) 2px minmax(0, 1fr); align-items: stretch; width: 100%; min-width: 0; min-height: 0; flex: 1 1 auto; }
.xp-login-logo { width: min(100%, 20rem); margin-inline: auto; }
.xp-login-brand > div:last-child { width: 100%; text-align: center; }
.xp-login-user :deep(.xp-account-login) { width: min(100%, 38rem); gap: 1rem; padding: .8rem; border: 1px solid #91b3f0aa; border-radius: .7rem; background: linear-gradient(100deg, #3159adbb, #3159ad44 78%, transparent); box-shadow: 0 0 0 1px #4269bb66, 0 4px 12px #24427a33; }
.xp-login-user :deep(.xp-account-avatar) { flex-basis: clamp(5.6rem, 7vw, 7.2rem); width: clamp(5.6rem, 7vw, 7.2rem); height: clamp(5.6rem, 7vw, 7.2rem); border: 2px solid #f4d959; border-radius: .35rem; box-shadow: 0 0 0 2px #1d428c; }
.xp-login-user :deep(.xp-account-name) { margin-bottom: .35rem; font-size: clamp(1.7rem, 2vw, 2.2rem); }
.xp-login-user :deep(.xp-password-label) { margin-bottom: .3rem; font-size: 1.15rem; }
.xp-login-user :deep(.xp-password-entry) { height: 3.2rem; gap: .8rem; }
.xp-login-user :deep(.xp-password-entry input) { border: 1px solid #9aabc6; border-radius: .3rem; box-shadow: inset 1px 1px 3px #0003; font-size: 1.4rem; }
.xp-login-user :deep(.xp-password-entry button) { flex-basis: 3rem; border: 1px solid #d5f6d7; border-radius: .4rem; background: linear-gradient(#8de889, #169d22 52%, #087316); box-shadow: inset 1px 1px 2px #e5ffe6, 0 1px 2px #173e1c; color: white; font-size: 1.8rem; text-shadow: 0 1px 2px #145a19; }
.xp-login-skip { position: absolute; right: clamp(1.2rem, 3vw, 3rem); bottom: 1.5rem; padding: .6rem 1rem; border: 1px solid #b9d0f5; border-radius: .4rem; background: linear-gradient(#477fc7, #174c91); color: #fff; font: 1.25rem Tahoma, "Microsoft YaHei", sans-serif; cursor: pointer; box-shadow: 0 2px 8px #0005; }
.xp-login-skip:hover { background: linear-gradient(#6196dc, #2462ad); }
.xp-login-skip:focus-visible { outline: 2px solid #ffe879; outline-offset: 3px; }
@media (max-width: 768px), (max-height: 520px) {
  .xp-login-screen { min-height: 0; padding-block: 7vh 12vh; }
  .xp-login-skip { right: 1rem; bottom: .8rem; padding: .45rem .7rem; font-size: 1.1rem; }
  .xp-login-frame { padding: .6rem .8rem; }
  .xp-login-main { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1px auto; align-content: center; justify-content: stretch; width: 100%; height: 100%; row-gap: clamp(1.2rem, 3.5vh, 2.2rem); }
  .xp-login-brand { width: 100%; height: auto; min-height: 0; padding: 0; }
  .xp-login-logo { width: min(100%, 18rem); margin: 0 auto; }
  .xp-login-prompt { margin-top: .4rem; font-size: clamp(1.2rem, 3.5vw, 1.5rem); line-height: 1.25; }
  .xp-login-divider { display: block; justify-self: center; align-self: center; width: min(72%, 24rem); height: 1px; background: linear-gradient(90deg, transparent 0%, #ffffff30 16%, #ffffffa8 50%, #ffffff30 84%, transparent 100%); }
  .xp-login-user { width: 100%; height: auto; min-height: 0; padding: 0; }
  .xp-login-user > div { max-height: 100%; }
  .xp-login-user :deep(.xp-account-avatar) { flex-basis: clamp(5.6rem, 18vw, 7rem); width: clamp(5.6rem, 18vw, 7rem); height: clamp(5.6rem, 18vw, 7rem); }
  .xp-login-user :deep(.xp-account-login) { padding: .6rem; }
}
@media (max-width: 420px) {
  .xp-login-screen { padding-block: 6vh 12vh; }
  .xp-login-frame { gap: .5rem; padding-inline: .5rem; }
  .xp-login-user { min-height: 0; }
}
@media (min-width: 761px) and (max-width: 1023px) {
  .xp-login-frame { padding-inline: 2rem; }
  .xp-login-brand { padding-right: 1rem; }
  .xp-login-user { padding-left: 1rem; }
}
@keyframes iconin {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.icon {
  animation: iconin 3s linear;
}
</style>
