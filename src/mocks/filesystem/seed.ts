import Avatar from "@/assets/avatar.jpg"
import LoginSound from "@/assets/audio/login.mp3"
import DesktopBackground from "@/assets/desktopBackground.jpg"
import type { FilesystemSnapshot, MockEntry } from "./types"

const seedTime = new Date("2001-08-24T09:00:00").getTime()

const entries: MockEntry[] = [
  { id: "my-computer", parentId: null, name: "我的电脑", kind: "folder", type: "system-folder", size: 0, modifiedAt: seedTime, system: true },
  { id: "drive-c", parentId: "my-computer", name: "本地磁盘 (C:)", kind: "folder", type: "drive", size: 12_884_901_888, modifiedAt: seedTime, system: true },
  { id: "drive-d", parentId: "my-computer", name: "DVD 驱动器 (D:)", kind: "folder", type: "drive", size: 4_700_000_000, modifiedAt: seedTime, system: true },
  { id: "my-documents", parentId: "drive-c", name: "我的文档", kind: "folder", type: "folder", size: 0, modifiedAt: seedTime },
  { id: "desktop-folder", parentId: "drive-c", name: "桌面", kind: "folder", type: "folder", size: 0, modifiedAt: seedTime },
  { id: "my-pictures", parentId: "drive-c", name: "图片收藏", kind: "folder", type: "folder", size: 0, modifiedAt: seedTime },
  { id: "my-music", parentId: "drive-c", name: "我的音乐", kind: "folder", type: "folder", size: 0, modifiedAt: seedTime },
  { id: "sample-readme", parentId: "my-documents", name: "欢迎使用 Windows XP.txt", kind: "file", type: "text/plain", size: 248, modifiedAt: seedTime, content: "这是一个完全在浏览器本地运行的 Windows XP 风格桌面模拟。\n\n文件、回收站和系统设置都是本地 mock 数据。", system: true },
  { id: "sample-blog-link", parentId: "my-documents", name: "个人主页.url", kind: "file", type: "text/x-url-shortcut", size: 32, modifiedAt: seedTime, content: "http://blog.local/", system: true },
  { id: "sample-avatar", parentId: "my-pictures", name: "我的头像.jpg", kind: "file", type: "image/jpeg", size: 106_340, modifiedAt: seedTime, assetUrl: Avatar },
  { id: "sample-desktop-wallpaper", parentId: "my-pictures", name: "桌面壁纸.jpg", kind: "file", type: "image/jpeg", size: 399_620, modifiedAt: seedTime, assetUrl: DesktopBackground },
  { id: "sample-login-sound", parentId: "my-music", name: "Windows 登录.mp3", kind: "file", type: "audio/mpeg", size: 129_190, modifiedAt: seedTime, assetUrl: LoginSound },
]

export function createSeedFilesystem(): FilesystemSnapshot {
  return { version: 1, entries: entries.map((entry) => ({ ...entry })), recycleBin: [] }
}
