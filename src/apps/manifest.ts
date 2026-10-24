import ComputerIcon from "@/assets/systemIcon/我的电脑.ico"
import RecycleIcon from "@/assets/systemIcon/回收站.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"
import IeIcon from "@/assets/systemIcon/IE浏览器.ico"
import BlogIcon from "@/assets/systemIcon/博客.ico"
import WindowsIcon from "@/assets/WindowsXP.ico"

export interface DesktopApp {
  id: string
  title: string
  icon: string
  description: string
  kind: "computer" | "recycle" | "network" | "browser" | "blog" | "settings"
  externalUrl?: string
}

export const desktopApps: DesktopApp[] = [
  { id: "computer", title: "我的电脑", icon: ComputerIcon, description: "系统文件与磁盘驱动器", kind: "computer" },
  { id: "recycle", title: "回收站", icon: RecycleIcon, description: "回收站当前为空。", kind: "recycle" },
  { id: "network", title: "网络邻居", icon: NetworkIcon, description: "查看网络连接与共享资源。", kind: "network" },
  { id: "browser", title: "Internet Explorer", icon: IeIcon, description: "打开我的掘金主页。", kind: "browser", externalUrl: "https://juejin.cn/user/3065861918435437" },
  { id: "blog", title: "个人博客", icon: BlogIcon, description: "访问我的掘金主页。", kind: "blog", externalUrl: "https://juejin.cn/user/3065861918435437" },
  { id: "settings", title: "控制面板", icon: WindowsIcon, description: "更改桌面背景和演示偏好。", kind: "settings" },
]

export function getDesktopApp(id: string) {
  return desktopApps.find((app) => app.id === id)
}
