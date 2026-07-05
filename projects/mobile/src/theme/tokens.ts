/**
 * 移动端设计令牌
 * 从共享包 @apps/config 派生，保持与 apps/projects/mall 的 CSS 变量语义一致。
 */

import { theme } from '@apps/config'

const { semanticColors, softColors, radius, shadows } = theme

export const Tokens = {
  ...semanticColors,
  ...softColors,

  white: theme.primitiveColors.white,
  black: theme.primitiveColors.black,
  snow: theme.primitiveColors.snow,
  eclipse: theme.primitiveColors.eclipse,

  radius: radius.DEFAULT,
  radiusSm: radius.sm,
  radiusLg: radius.lg,
  radiusXl: radius.xl,
  radiusFull: radius.full,

  shadowSurface: shadows.surface,
  shadowOverlay: shadows.overlay,
} as const

export type TokensType = typeof Tokens
