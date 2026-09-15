/** Shared shapes for the gorg navigation family. */

export interface GorgDropdownItem {
  label?: string
  icon?: string
  /** right-aligned hint, e.g. `⌘K` */
  shortcut?: string
  to?: string
  disabled?: boolean
  /** paints the row in the critical role — delete, revoke, sign out */
  destructive?: boolean
  /** render a rule instead of a row; every other field is ignored */
  separator?: boolean
  /** one level of nested menu */
  children?: GorgDropdownItem[]
  onSelect?: (event: Event) => void
}

export interface GorgBreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

export interface GorgTabItem {
  value: string
  label: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}
