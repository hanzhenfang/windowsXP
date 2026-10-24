<script lang="ts" setup>
import { ref } from "vue"

const props = defineProps<{ selected?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ (event: "select"): void; (event: "unlock"): void }>()
const password = ref("")
const errorMessage = ref("")

function submitLogin() {
  if (props.disabled) return
  if (!password.value.trim()) {
    errorMessage.value = "请输入密码后再登录。演示环境不会验证密码内容。"
    return
  }
  errorMessage.value = ""
  emit("unlock")
}
</script>

<template>
  <div class="mobile-login-card">
    <button
      v-if="!selected"
      class="xp-account-login xp-mobile-account-choice"
      type="button"
      :disabled="disabled"
      aria-label="选择韩振方账户"
      @click="emit('select')"
    >
      <img class="xp-account-avatar" src="@/assets/avatar.jpg" alt="" />
      <span class="xp-account-name">韩振方</span>
    </button>

    <form v-else class="xp-account-login" @submit.prevent="submitLogin">
      <img class="xp-account-avatar" src="@/assets/avatar.jpg" alt="" />
      <div class="xp-account-details">
        <div class="xp-account-name">韩振方</div>
        <label class="xp-password-label" for="mobile-xp-password">键入密码</label>
        <div class="xp-password-entry">
          <input
            id="mobile-xp-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            aria-label="密码"
            :aria-invalid="Boolean(errorMessage)"
            :disabled="disabled"
            @input="errorMessage = ''"
          />
          <button type="submit" aria-label="登录" :disabled="disabled">➜</button>
        </div>
        <p v-if="errorMessage" class="xp-login-error" role="alert">{{ errorMessage }}</p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.mobile-login-card { width: min(92vw, 38rem); display: flex; justify-content: center; }
.xp-account-login { width: min(100%, 38rem); display: flex; align-items: center; gap: clamp(1.2rem, 2vw, 2.4rem); padding: 1.2rem; color: #fff; }
.xp-account-avatar { flex: 0 0 clamp(7rem, 9vw, 10rem); width: clamp(7rem, 9vw, 10rem); height: clamp(7rem, 9vw, 10rem); object-fit: cover; border: 2px solid #fff; border-radius: .7rem; box-shadow: 2px 3px 8px #132c5877; }
.xp-account-details { flex: 1; min-width: 0; }
.xp-account-name { margin-bottom: .35rem; color: #fff; font-size: clamp(1.7rem, 2vw, 2.2rem); font-weight: 600; text-shadow: 1px 1px 2px #17477e; }
.xp-password-label { display: block; margin-bottom: .3rem; font-size: 1.15rem; }
.xp-password-entry { display: flex; align-items: stretch; height: 3.2rem; gap: .8rem; }
.xp-password-entry input { flex: 1; min-width: 0; padding: .4rem .8rem; border: 1px solid #9aabc6; border-radius: .3rem; background: #fff; box-shadow: inset 1px 1px 3px #0003; color: #222; font: 1.4rem Tahoma, sans-serif; user-select: text; }
.xp-password-entry input:focus-visible, .xp-password-entry button:focus-visible, .xp-mobile-account-choice:focus-visible { outline: 2px solid #ffe879; outline-offset: 2px; }
.xp-password-entry button { flex: 0 0 3rem; border: 1px solid #d5f6d7; border-radius: .4rem; background: linear-gradient(#8de889, #169d22 52%, #087316); box-shadow: inset 1px 1px 2px #e5ffe6, 0 1px 2px #173e1c; color: white; font-size: 1.8rem; font-weight: 700; text-shadow: 0 1px 2px #145a19; cursor: pointer; }
.xp-password-entry button:disabled, .xp-password-entry input:disabled, .xp-mobile-account-choice:disabled { opacity: .72; cursor: wait; }
.xp-login-error { margin-top: .5rem; color: #fff2aa; font-size: 1.15rem; line-height: 1.35; }
.xp-mobile-account-choice { justify-content: flex-start; border: 1px solid #91b3f0aa; border-radius: .7rem; background: linear-gradient(100deg, #3159adbb, #3159ad44 78%, transparent); box-shadow: 0 0 0 1px #4269bb66, 0 4px 12px #24427a33; text-align: left; cursor: pointer; }
.xp-mobile-account-choice .xp-account-avatar { flex-basis: clamp(5.6rem, 7vw, 7.2rem); width: clamp(5.6rem, 7vw, 7.2rem); height: clamp(5.6rem, 7vw, 7.2rem); border: 2px solid #f4d959; border-radius: .35rem; box-shadow: 0 0 0 2px #1d428c; }
@media (max-width: 420px) {
  .xp-account-login { gap: .8rem; padding: .6rem; }
  .xp-account-avatar { flex-basis: 5.6rem; width: 5.6rem; height: 5.6rem; }
  .xp-password-entry { gap: .5rem; }
  .xp-password-entry button { flex-basis: 2.8rem; }
}
</style>
