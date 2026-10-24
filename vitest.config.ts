import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"

export default defineConfig({
  plugins: [Unocss({}), vue()],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
})
