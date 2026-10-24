import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"
import { readFileSync } from "node:fs"
import { extname, resolve, sep } from "node:path"

function inlineDesktopImages() {
  const desktopIconsPath = resolve(__dirname, "src/assets/systemIcon") + sep
  const wallpaperPath = resolve(__dirname, "src/assets/deskbg.jpg")
  const mimeTypes: Record<string, string> = {
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  }

  return {
    name: "inline-desktop-images",
    enforce: "pre" as const,
    load(id: string) {
      const filePath = resolve(id.split("?", 1)[0])
      const isDesktopIcon = filePath.startsWith(desktopIconsPath)
      if (filePath !== wallpaperPath && !isDesktopIcon) return null

      const mimeType = mimeTypes[extname(filePath).toLowerCase()]
      if (!mimeType) return null

      const data = readFileSync(filePath).toString("base64")
      return `export default ${JSON.stringify(`data:${mimeType};base64,${data}`)}`
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [inlineDesktopImages(), Unocss({}), vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
