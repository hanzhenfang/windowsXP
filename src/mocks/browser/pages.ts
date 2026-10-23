export interface MockBlogPost {
  id: string
  slug: string
  title: string
  date: string
  excerpt: string
  content: string
  sample: true
}

export const mockBlogPosts: MockBlogPost[] = [
  {
    id: "xp-desktop",
    slug: "windows-xp-desktop",
    title: "把 Windows XP 的桌面手感留在浏览器里",
    date: "2026-10-24",
    excerpt: "桌面图标、开始菜单和窗口状态如何组成一套熟悉的本地交互。",
    content: "这是一篇用于本地演示的示例文章。\n\nWindows XP 的手感来自细节：单击选中、双击打开，窗口可以拖动和缩放，任务栏记录正在打开的程序。\n\n这里的文件和系统状态都保存在浏览器本地，不会连接外部网站。",
    sample: true,
  },
  {
    id: "local-files",
    slug: "local-file-system",
    title: "用本地 mock 文件树模拟我的电脑",
    date: "2026-10-23",
    excerpt: "以可还原的回收站和本地预览，模拟早期桌面系统中的文件操作。",
    content: "这是一篇用于本地演示的示例文章。\n\n示例文件有自己的路径、类型、大小和修改时间。新建、重命名、删除和还原操作通过本地存储完成。",
    sample: true,
  },
  {
    id: "offline-web",
    slug: "offline-web-app",
    title: "让网页里的模拟网络保持离线",
    date: "2026-10-22",
    excerpt: "网络邻居展示预置的共享计算机，而连接开关只改变本地状态。",
    content: "这是一篇用于本地演示的示例文章。\n\n模拟系统里的网络邻居和 Internet Explorer 都不会建立真实连接。未知地址只会显示本地提示页。",
    sample: true,
  },
]

export type LocalPageKind = "home" | "welcome" | "blog-index" | "article" | "search" | "error"

export interface LocalPage {
  address: string
  title: string
  kind: LocalPageKind
  summary?: string
  post?: MockBlogPost
  query?: string
  results?: MockBlogPost[]
  requestedAddress?: string
}

const pageByAddress = new Map<string, LocalPage>([
  ["about:home", { address: "about:home", title: "本地主页", kind: "home", summary: "本地模拟主页" }],
  ["http://windows-xp.local/", { address: "http://windows-xp.local/", title: "Windows XP 本地首页", kind: "welcome", summary: "欢迎来到本地模拟的 Windows XP 桌面。" }],
  ["http://blog.local/", { address: "http://blog.local/", title: "个人博客 · 本地示例", kind: "blog-index", summary: "本页文章为本地演示内容。" }],
])

for (const post of mockBlogPosts) {
  const address = `http://blog.local/articles/${post.slug}.html`
  pageByAddress.set(address, { address, title: post.title, kind: "article", summary: post.excerpt, post })
}

function localSearch(query: string, address = `about:search?q=${encodeURIComponent(query)}`): LocalPage {
  const normalized = query.trim().toLocaleLowerCase()
  const results = mockBlogPosts.filter((post) => `${post.title} ${post.excerpt} ${post.content}`.toLocaleLowerCase().includes(normalized))
  return { address, title: `搜索结果：${query}`, kind: "search", query, results }
}

function localError(requestedAddress: string): LocalPage {
  return { address: requestedAddress, title: "无法显示此页面", kind: "error", requestedAddress }
}

export function resolveLocalPage(address: string): LocalPage {
  const input = address.trim()
  if (!input || input.toLocaleLowerCase() === "about:home") return pageByAddress.get("about:home")!
  if (input.toLocaleLowerCase().startsWith("about:search?")) {
    const query = new URLSearchParams(input.slice(input.indexOf("?") + 1)).get("q") ?? ""
    return localSearch(query, `about:search?q=${encodeURIComponent(query)}`)
  }

  const addressWithScheme = /^(?:https?:\/\/)/i.test(input) ? input : /^(?:blog\.local|windows-xp\.local)(?:\/|$)/i.test(input) ? `http://${input}` : ""
  if (addressWithScheme) {
    try {
      const parsed = new URL(addressWithScheme)
      const host = parsed.hostname.toLocaleLowerCase()
      if (!new Set(["blog.local", "windows-xp.local"]).has(host)) return localError(input)
      const path = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/+$/, "")
      const normalized = `http://${host}${path}`
      const found = pageByAddress.get(normalized)
      return found ?? localError(input)
    } catch {
      return localError(input)
    }
  }

  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(input) || /\.[a-z]{2,}(?:[/:?#]|$)/i.test(input)) return localError(input)
  return localSearch(input)
}
