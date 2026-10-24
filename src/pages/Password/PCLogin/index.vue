<script lang="ts" setup>
import { computed, ref } from "vue"

const props = defineProps<{
  shutDownModal: boolean
  disabled?: boolean
}>()
const emit = defineEmits<{ (event: "unlock"): void }>()
const password = ref("")
const errorMessage = ref("")
const isDisabled = computed(() => props.disabled || props.shutDownModal)

function submitLogin() {
  if (isDisabled.value) return
  if (!password.value.trim()) {
    errorMessage.value = "请输入密码后再登录。演示环境不会验证密码内容。"
    return
  }
  errorMessage.value = ""
  emit("unlock")
}
</script>

<template>
  <form class="xp-account-login" @submit.prevent="submitLogin">
    <img class="xp-account-avatar" src="@/assets/avatar.jpg" alt="" />
    <div class="xp-account-details">
      <div class="xp-account-name">韩振方</div>
      <label class="xp-password-label" for="xp-password">键入密码</label>
      <div class="xp-password-entry">
        <input
          id="xp-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          aria-label="密码"
          :aria-invalid="Boolean(errorMessage)"
          @input="errorMessage = ''"
          :disabled="isDisabled"
        />
        <button type="submit" aria-label="登录" :disabled="isDisabled">➜</button>
      </div>
      <p v-if="errorMessage" class="xp-login-error" role="alert">{{ errorMessage }}</p>
    </div>
  </form>
</template>

<style scoped>
.xp-account-login { width: min(100%, 39rem); display: flex; align-items: center; gap: clamp(1.2rem, 2vw, 2.4rem); padding: 1.2rem; color: #fff; }
.xp-account-avatar { flex: 0 0 clamp(7rem, 9vw, 10rem); width: clamp(7rem, 9vw, 10rem); height: clamp(7rem, 9vw, 10rem); object-fit: cover; border: 2px solid #fff; border-radius: .7rem; box-shadow: 2px 3px 8px #132c5877; }
.xp-account-details { flex: 1; min-width: 0; }
.xp-account-name { margin-bottom: .8rem; font-size: clamp(1.8rem, 2vw, 2.4rem); font-weight: 600; text-shadow: 1px 1px 2px #17477e; }
.xp-password-label { display: block; margin-bottom: .4rem; font-size: 1.2rem; }
.xp-password-entry { display: flex; align-items: stretch; height: 3.4rem; }
.xp-password-entry input { flex: 1; min-width: 0; padding: .4rem .8rem; border: 2px inset #ddd; background: #fff; color: #222; font: 1.6rem Tahoma, sans-serif; user-select: text; }
.xp-password-entry input:focus-visible { outline: 2px solid #ffe879; outline-offset: 2px; }
.xp-password-entry button { flex: 0 0 3.8rem; border: 1px solid #144f9a; border-left: 0; background: linear-gradient(#fff,#d9e8fa); color: #174c92; font-size: 2rem; font-weight: 700; cursor: pointer; }
.xp-password-entry button:focus-visible { outline: 2px solid #ffe879; outline-offset: 2px; }
.xp-password-entry button:disabled, .xp-password-entry input:disabled { opacity: .72; cursor: wait; }
.xp-login-error { margin-top: .5rem; color: #fff2aa; font-size: 1.15rem; line-height: 1.35; }
@media (max-width: 760px), (max-height: 520px) {
  .xp-account-login { width: min(100%, 38rem); padding: .4rem; gap: 1.2rem; }
  .xp-account-avatar { flex-basis: clamp(6.4rem, 19vw, 9rem); width: clamp(6.4rem, 19vw, 9rem); height: clamp(6.4rem, 19vw, 9rem); }
}
@media (max-width: 380px) {
  .xp-account-login { gap: .8rem; padding: 0; }
  .xp-account-avatar { flex-basis: 6rem; width: 6rem; height: 6rem; }
}
</style>
