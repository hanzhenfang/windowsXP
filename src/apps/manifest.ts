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
  kind: "computer" | "recycle" | "network" | "network-connections" | "browser" | "blog" | "control-panel" | "display-properties" | "sound-properties"
  defaultFolderId?: string
  desktopVisible?: boolean
  system?: boolean
}

export const desktopApps: DesktopApp[] = [
  { id: "computer", title: "我的电脑", icon: ComputerIcon, description: "系统文件与磁盘驱动器", kind: "computer", defaultFolderId: "my-computer", system: true },
  { id: "recycle", title: "回收站", icon: RecycleIcon, description: "本地删除项目与还原操作。", kind: "recycle", system: true },
  { id: "network", title: "网络邻居", icon: NetworkIcon, description: "查看网络连接与共享资源。", kind: "network", system: true },
  { id: "network-connections", title: "网络连接", icon: NetworkIcon, description: "管理本地模拟网络连接。", kind: "network-connections", system: true, desktopVisible: false },
  { id: "browser", title: "Internet Explorer", icon: IeIcon, description: "本地模拟的 Internet Explorer，不连接外部网站。", kind: "browser" },
  { id: "blog", title: "个人博客", icon: BlogIcon, description: "韩振方的个人主页本地演示版。", kind: "blog" },
  { id: "control-panel", title: "控制面板", icon: WindowsIcon, description: "更改本地模拟系统的显示、声音和桌面选项。", kind: "control-panel" },
  { id: "display-properties", title: "显示 属性", icon: WindowsIcon, description: "选择本地壁纸、主题颜色和图标大小。", kind: "display-properties", desktopVisible: false },
  { id: "sound-properties", title: "声音和音频设备 属性", icon: WindowsIcon, description: "设置本地系统音效和音量。", kind: "sound-properties", desktopVisible: false },
]

export function getDesktopApp(id: string) {
  return desktopApps.find((app) => app.id === id)
}
