<script lang="ts" setup>
import { computed, ref } from "vue"
import { mockBlogPosts } from "@/mocks/browser/pages"

const selectedPostId = ref<string | null>(null)
const selectedPost = computed(() => mockBlogPosts.find((post) => post.id === selectedPostId.value))
const textOnlyProfileAddress = "https://juejin.cn/user/3065861918435437"
</script>

<template>
  <div class="xp-blog-app">
    <header class="xp-blog-header"><span>个人博客</span><small>本地示例站点</small></header>
    <div class="xp-blog-layout">
      <aside class="xp-blog-profile"><div class="xp-blog-avatar">韩</div><h2>韩振方</h2><p>个人主页的本地演示版。</p><p>这里的文章均为明确标注的示例内容。</p><div class="xp-blog-profile-address"><b>原个人主页地址（仅文本）</b><code>{{ textOnlyProfileAddress }}</code></div></aside>
      <main class="xp-blog-content">
        <template v-if="selectedPost"><button class="xp-ie-breadcrumb" @click="selectedPostId = null">‹ 返回文章列表</button><small>{{ selectedPost.date }} · 本地示例文章</small><h1>{{ selectedPost.title }}</h1><p class="xp-ie-article-excerpt">{{ selectedPost.excerpt }}</p><pre>{{ selectedPost.content }}</pre></template>
        <template v-else><h1>文章</h1><button v-for="post in mockBlogPosts" :key="post.id" class="xp-blog-post" @click="selectedPostId = post.id"><b>{{ post.title }}</b><small>{{ post.date }} · 示例文章</small><span>{{ post.excerpt }}</span></button></template>
      </main>
    </div>
    <footer class="xp-blog-footer">所有页面和文章均在本地显示，不会跳转到外部网站。</footer>
  </div>
</template>
