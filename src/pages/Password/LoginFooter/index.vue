<script lang="ts" setup>
const props = defineProps<{
  isShow: boolean
  isLoginSuccess: boolean
  closeBtnText: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: "clickCloseBtn")
}>()
</script>

<template>
  <div
    class="xp-login-footer absolute z-99 w-full flex justify-between"
    :style="[
      isShow && !isLoginSuccess
        ? { transform: `translateY(0)` }
        : { transform: `translateY(100%)` },
      { transition: `all 1.5s` },
    ]"
  >
    <button class="xp-footer-return" type="button" :disabled="props.disabled" @click.stop="emit('clickCloseBtn')">
      <img src="@/assets/systemIcon/关机.ico" />
      <span class="xp-footer-action">{{ closeBtnText === '关闭' ? '关闭计算机' : closeBtnText }}</span>
    </button>

    <div class="max-w-14rem flex items-center">
      <span class=""
        >登录后, 你可以添加或更改账户，请转到“控制面板”,
        并单击“用户账户”。</span
      >
    </div>
  </div>
</template>

<style scoped>
.xp-login-footer { left: 0; bottom: 0; min-height: clamp(8rem, 16vh, 12rem); padding: .8rem clamp(2rem, 5vw, 5rem); align-items: center; gap: 1rem; border-radius: 0; background: #00349b; }
.xp-login-footer > .xp-footer-return { flex: 0 0 auto; display: flex; align-items: center; gap: .8rem; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.xp-footer-return:focus-visible { outline: 3px solid #ffe879; outline-offset: 3px; }
.xp-footer-return:disabled { opacity: .65; cursor: wait; }
.xp-login-footer img { width: clamp(3.2rem, 5vw, 5.5rem); height: clamp(3.2rem, 5vw, 5.5rem); object-fit: contain; }
.xp-login-footer > div:last-child { flex: 0 1 clamp(20rem, 38vw, 36rem); max-width: none; min-width: 0; font-size: clamp(1rem, 1.2vw, 1.3rem); line-height: 1.4; }
.xp-footer-action { font-size: clamp(1.5rem, 2vw, 2rem); font-weight: 500; }
@media (max-width: 600px) {
  .xp-login-footer { min-height: 12vh; padding-inline: 1rem; }
  .xp-login-footer > div:last-child { flex-basis: 55%; }
  .xp-footer-action { font-size: clamp(1.35rem, 4vw, 1.7rem); }
  .xp-login-footer > div:last-child { font-size: clamp(1rem, 3vw, 1.2rem); }
}
</style>
