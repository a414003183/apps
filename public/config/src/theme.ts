/**
 * 共享设计令牌
 * 颜色来源于 apps/projects/mall/src/styles/globals.css 中 HeroUI 默认 oklch 变量的 sRGB 近似值。
 * 供 admin / mall / mobile / weapp 等子项目引用。
 */

export const primitiveColors = {
  white: '#ffffff',
  black: '#000000',
  snow: '#fcfcfc',
  eclipse: '#18181b',
} as const

export const semanticColors = {
  background: '#f5f5f5',
  foreground: '#18181b',

  surface: '#ffffff',
  surfaceForeground: '#18181b',
  surfaceSecondary: '#efeff0',
  surfaceSecondaryForeground: '#18181b',
  surfaceTertiary: '#eaeaeb',
  surfaceTertiaryForeground: '#18181b',

  overlay: '#ffffff',
  overlayForeground: '#18181b',

  muted: '#71717a',
  scrollbar: '#d4d4d8',

  default: '#ebebec',
  defaultForeground: '#18181b',

  accent: '#0485f7',
  accentForeground: '#fcfcfc',

  focus: '#0485f7',
  link: '#18181b',

  success: '#17c964',
  successForeground: '#18181b',
  successDark: '#12a34e',

  warning: '#f5a524',
  warningDark: '#d48a1a',
  warningForeground: '#18181b',

  danger: '#ff383c',
  dangerDark: '#e01e22',
  dangerForeground: '#fcfcfc',

  border: '#dedee0',
  separator: '#e4e4e7',
  backdrop: 'rgba(0, 0, 0, 0.5)',

  /* 电商常用 */
  price: '#0485f7',
} as const

export const softColors = {
  accentSoft: 'rgba(4, 133, 247, 0.15)',
  successSoft: 'rgba(23, 201, 100, 0.15)',
  warningSoft: 'rgba(245, 165, 36, 0.15)',
  dangerSoft: 'rgba(255, 56, 60, 0.15)',
  defaultSoft: 'rgba(235, 235, 236, 0.85)',
} as const

export const radius = {
  sm: 6,
  DEFAULT: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const

/** React Native 可直接使用的阴影对象 */
export const shadows = {
  surface: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  overlay: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
} as const

/** Web CSS 使用的阴影字符串 */
export const cssShadows = {
  surface: '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.06)',
  overlay: '0 4px 16px 0 rgba(24, 24, 27, 0.08), 0 8px 24px 0 rgba(24, 24, 27, 0.09)',
  field: '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.06)',
} as const

export const fonts = {
  sans:
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  mono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  body:
    'system-ui, "PingFang SC", "Noto Sans SC", "Microsoft YaHei UI", sans-serif',
} as const

export const theme = {
  primitiveColors,
  semanticColors,
  softColors,
  radius,
  shadows,
  cssShadows,
  fonts,
} as const

export type Theme = typeof theme
