import ComputerIcon from "@/assets/systemIcon/我的电脑.ico"
import RecycleIcon from "@/assets/systemIcon/回收站.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"
import IeIcon from "@/assets/systemIcon/IE浏览器.ico"
import BlogIcon from "@/assets/systemIcon/博客.ico"

export interface DesktopApp {
  id: string
  title: string
  icon: string
  description: string
  kind: "computer" | "recycle" | "network" | "browser" | "blog"
  system?: boolean
}

export const desktopApps: DesktopApp[] = [
  { id: "computer", title: "我的电脑", icon: ComputerIcon, description: "系统文件与磁盘驱动器", kind: "computer", system: true },
  { id: "recycle", title: "回收站", icon: RecycleIcon, description: "回收站当前为空。", kind: "recycle", system: true },
  { id: "network", title: "网络邻居", icon: NetworkIcon, description: "查看网络连接与共享资源。", kind: "network", system: true },
  { id: "browser", title: "Internet Explorer", icon: IeIcon, description: "本地模拟的 Internet Explorer。", kind: "browser" },
  { id: "blog", title: "个人博客", icon: BlogIcon, description: "本地个人主页和示例文章。", kind: "blog" },
]

export function getDesktopApp(id: string) {
  return desktopApps.find((app) => app.id === id)
}
