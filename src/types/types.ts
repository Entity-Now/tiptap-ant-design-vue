export interface MenuItem {
  text: string; // 菜单项文本
  command: () => void; // 菜单项命令
  disabled?: boolean | import('vue').ComputedRef<boolean>; // 禁用状态
}