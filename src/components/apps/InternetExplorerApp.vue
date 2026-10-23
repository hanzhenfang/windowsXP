<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import { usePreferencesStore } from "@/store/preferencesStore"
import { useWindowStore } from "@/store/windowStore"
import { mockBlogPosts, resolveLocalPage } from "@/mocks/browser/pages"

interface BrowserTabState { id: string; address: string; history: string[]; historyIndex: number }
const props = defineProps<{ windowId: string }>()
const preferences = usePreferencesStore()
const windows = useWindowStore()
let nextTabId = 0
const tabs = ref<BrowserTabState[]>([makeTab("about:home")])
const activeTabId = ref(tabs.value[0].id)
const addressInput = ref("about:home")
const searchInput = ref("")
const pageRevision = ref(0)
const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value) ?? tabs.value[0])
const page = computed(() => { pageRevision.value; return resolveLocalPage(activeTab.value?.address ?? "about:home") })
const canBack = computed(() => (activeTab.value?.historyIndex ?? 0) > 0)
const canForward = computed(() => (activeTab.value?.historyIndex ?? 0) < (activeTab.value?.history.length ?? 0) - 1)
const isFavorite = computed(() => preferences.browserFavorites.includes(activeTab.value?.address ?? ""))
const favoriteLabels = computed(() => preferences.browserFavorites.map((address) => ({ address, title: resolveLocalPage(address).title })))

function makeTab(address: string): BrowserTabState {
  const initialAddress = resolveLocalPage(address).address
  return { id: `ie-tab-${++nextTabId}`, address: initialAddress, history: [initialAddress], historyIndex: 0 }
}
function updateWindowTitle() {
  windows.setWindowTitle(props.windowId, `Internet Explorer - ${page.value.title}`)
}
watch(() => activeTab.value?.address, (address) => {
  addressInput.value = address ?? "about:home"
  pageRevision.value++
  updateWindowTitle()
}, { immediate: true })
watch(page, updateWindowTitle)

function navigate(address: string, addHistory = true) {
  const tab = activeTab.value
  if (!tab) return
  const nextPage = resolveLocalPage(address)
  if (addHistory) {
    tab.history = tab.history.slice(0, tab.historyIndex + 1)
    if (tab.history[tab.history.length - 1] !== nextPage.address) tab.history.push(nextPage.address)
    tab.historyIndex = tab.history.length - 1
  }
  tab.address = nextPage.address
  addressInput.value = nextPage.address
  pageRevision.value++
}
function submitAddress() { navigate(addressInput.value) }
function submitSearch() {
  const query = searchInput.value.trim()
  if (!query) return
  navigate(query)
  searchInput.value = ""
}
function goBack() {
  const tab = activeTab.value
  if (!tab || !canBack.value) return
  tab.historyIndex--
  navigate(tab.history[tab.historyIndex], false)
}
function goForward() {
  const tab = activeTab.value
  if (!tab || !canForward.value) return
  tab.historyIndex++
  navigate(tab.history[tab.historyIndex], false)
}
function refreshPage() { pageRevision.value++ }
function goHome() { navigate("about:home") }
function newTab(address = "about:home") {
  const tab = makeTab(address)
  tabs.value.push(tab)
  activeTabId.value = tab.id
}
function closeTab(id: string) {
  if (tabs.value.length === 1) { navigate("about:home"); return }
  const index = tabs.value.findIndex((tab) => tab.id === id)
  tabs.value = tabs.value.filter((tab) => tab.id !== id)
  if (activeTabId.value === id) activeTabId.value = tabs.value[Math.max(0, index - 1)].id
}
function toggleFavorite() {
  if (isFavorite.value) preferences.removeBrowserFavorite(activeTab.value.address)
  else preferences.addBrowserFavorite(activeTab.value.address)
}
function openBlogPost(slug: string) { navigate(`http://blog.local/articles/${slug}.html`) }
</script>

<template>
  <div class="xp-ie-app">
    <div class="xp-ie-tabs" role="tablist" aria-label="浏览器标签页">
      <div v-for="tab in tabs" :key="tab.id" class="xp-ie-tab" :class="{ active: tab.id === activeTabId }">
        <button class="xp-ie-tab-title" role="tab" :aria-selected="tab.id === activeTabId" @click="activeTabId = tab.id">{{ resolveLocalPage(tab.address).title }}</button>
        <button class="xp-ie-tab-close" :aria-label="`关闭标签页 ${resolveLocalPage(tab.address).title}`" @click="closeTab(tab.id)">×</button>
      </div>
      <button class="xp-ie-new-tab" aria-label="新建标签页" @click="newTab()">＋</button>
    </div>
    <div class="xp-ie-navigation">
      <button aria-label="后退" :disabled="!canBack" @click="goBack">◀</button>
      <button aria-label="前进" :disabled="!canForward" @click="goForward">▶</button>
      <button aria-label="刷新" @click="refreshPage">⟳</button>
      <button aria-label="主页" @click="goHome">⌂</button>
      <form class="xp-ie-address-form" @submit.prevent="submitAddress">
        <label for="xp-ie-address">地址</label>
        <input id="xp-ie-address" v-model="addressInput" autocomplete="off" spellcheck="false" />
        <button type="submit">转到</button>
      </form>
      <button class="xp-ie-favorite-toggle" :aria-label="isFavorite ? '从收藏夹移除' : '添加到收藏夹'" :title="isFavorite ? '从收藏夹移除' : '添加到收藏夹'" @click="toggleFavorite">{{ isFavorite ? '★' : '☆' }}</button>
    </div>
    <nav class="xp-ie-favorites" aria-label="收藏夹">
      <span>收藏夹：</span>
      <button v-for="favorite in favoriteLabels" :key="favorite.address" @click="navigate(favorite.address)">★ {{ favorite.title }}</button>
      <span v-if="!favoriteLabels.length">暂无收藏</span>
    </nav>
    <main class="xp-ie-page">
      <template v-if="page.kind === 'home'">
        <section class="xp-ie-home">
          <div class="xp-ie-logo">e</div><h1>Internet Explorer</h1><p>本地模拟主页</p>
          <form @submit.prevent="submitSearch"><input v-model="searchInput" aria-label="搜索本地示例" placeholder="搜索本地示例文章" /><button>搜索</button></form>
          <div class="xp-ie-home-links"><button @click="navigate('http://windows-xp.local/')">Windows XP 本地首页</button><button @click="navigate('http://blog.local/')">个人博客</button></div>
        </section>
      </template>
      <template v-else-if="page.kind === 'welcome'">
        <article class="xp-ie-local-page"><div class="xp-ie-site-mark">Windows XP · 本地首页</div><h1>{{ page.summary }}</h1><p>这是一个在浏览器本地运行的欢迎页面。</p><button @click="navigate('http://blog.local/')">打开个人博客</button></article>
      </template>
      <template v-else-if="page.kind === 'blog-index'">
        <article class="xp-ie-local-page"><div class="xp-ie-site-mark">韩振方的个人主页 · 本地演示</div><h1>文章</h1><p>{{ page.summary }}</p><button v-for="post in mockBlogPosts" :key="post.id" class="xp-ie-post-link" @click="openBlogPost(post.slug)"><b>{{ post.title }}</b><small>{{ post.date }} · 示例文章</small><span>{{ post.excerpt }}</span></button></article>
      </template>
      <template v-else-if="page.kind === 'article' && page.post">
        <article class="xp-ie-local-page xp-ie-article"><button class="xp-ie-breadcrumb" @click="navigate('http://blog.local/')">个人博客 › 文章</button><small>{{ page.post.date }} · 本地示例文章</small><h1>{{ page.post.title }}</h1><p class="xp-ie-article-excerpt">{{ page.post.excerpt }}</p><pre>{{ page.post.content }}</pre></article>
      </template>
      <template v-else-if="page.kind === 'search'">
        <article class="xp-ie-local-page"><div class="xp-ie-site-mark">本地示例搜索</div><h1>“{{ page.query }}”的搜索结果</h1><p>仅搜索内置的本地示例内容。</p><template v-if="page.results?.length"><button v-for="post in page.results" :key="post.id" class="xp-ie-post-link" @click="openBlogPost(post.slug)"><b>{{ post.title }}</b><small>blog.local · 示例文章</small><span>{{ post.excerpt }}</span></button></template><p v-else class="xp-ie-no-results">没有找到匹配的本地示例。</p></article>
      </template>
      <template v-else>
        <article class="xp-ie-error"><div class="xp-ie-error-icon">⚠️</div><h1>Internet Explorer 无法显示此页面</h1><p>地址不在本地模拟页面目录中。</p><code>{{ page.requestedAddress }}</code><p>此模拟浏览器不会连接外部网站，也没有发起网络请求。</p><button @click="goHome">返回本地主页</button></article>
      </template>
    </main>
    <footer class="xp-ie-status"><span>{{ page.kind === 'error' ? '已停止' : '已完成' }}</span><span>本地模拟模式</span></footer>
  </div>
</template>
