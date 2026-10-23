import { desktopApps } from "@/apps/manifest"
import ComputerIcon from "@/assets/systemIcon/我的电脑.ico"
import ShutdownIcon from "@/assets/systemIcon/关机.ico"
import NetworkIcon from "@/assets/systemIcon/网络邻居.ico"

export const desktopIconGroup = desktopApps.map((app) => ({ name: app.title, icon: app.icon, id: app.id }))
export const showDownIconGroup = [
  { name: "我的电脑", icon: ComputerIcon },
  { name: "关机(U)", icon: ShutdownIcon },
  { name: "网络邻居", icon: NetworkIcon },
]
