import { MD3LightTheme, configureFonts } from 'react-native-paper'
import { Tokens } from './tokens'

const fontConfig = {
  displayLarge: { fontFamily: 'System', fontWeight: '400' as const },
  displayMedium: { fontFamily: 'System', fontWeight: '400' as const },
  displaySmall: { fontFamily: 'System', fontWeight: '400' as const },
  headlineLarge: { fontFamily: 'System', fontWeight: '400' as const },
  headlineMedium: { fontFamily: 'System', fontWeight: '400' as const },
  headlineSmall: { fontFamily: 'System', fontWeight: '400' as const },
  titleLarge: { fontFamily: 'System', fontWeight: '600' as const },
  titleMedium: { fontFamily: 'System', fontWeight: '600' as const },
  titleSmall: { fontFamily: 'System', fontWeight: '600' as const },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' as const },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' as const },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const },
  labelLarge: { fontFamily: 'System', fontWeight: '500' as const },
  labelMedium: { fontFamily: 'System', fontWeight: '500' as const },
  labelSmall: { fontFamily: 'System', fontWeight: '500' as const },
}

/**
 * 语义化设计令牌，与 mall 的 CSS 变量对齐。
 * 新增代码优先使用 Tokens。
 */
export { Tokens }

/**
 * 历史色板别名，保持旧页面不报错。
 * 值已切换到与 mall 对齐的 token。
 */
export const Colors = {
  /* 品牌 */
  primary: Tokens.accent,
  primaryDark: '#0470d0',
  primarySoft: Tokens.accentSoft,

  /* 成功 */
  success: Tokens.success,
  successDark: '#12a34e',
  successSoft: Tokens.successSoft,

  /* 警告 */
  warning: Tokens.warning,
  warningDark: '#d48a1a',
  warningSoft: Tokens.warningSoft,

  /* 错误 */
  error: Tokens.danger,
  errorDark: '#e01e22',
  errorSoft: Tokens.dangerSoft,

  /* 文字 */
  ink: Tokens.foreground,
  inkSoft: Tokens.muted,
  muted: Tokens.muted,

  /* 背景 / 表面 */
  panel: Tokens.background,
  surface: Tokens.surface,
  surfaceMuted: Tokens.surfaceSecondary,

  /* 边框 */
  line: Tokens.border,
  lineSoft: Tokens.separator,

  /* 价格 */
  price: Tokens.price,
} as const

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Tokens.accent,
    primaryContainer: Tokens.accentSoft,
    onPrimary: Tokens.accentForeground,
    secondary: Tokens.success,
    secondaryContainer: Tokens.successSoft,
    onSecondary: Tokens.successForeground,
    tertiary: Tokens.warning,
    tertiaryContainer: Tokens.warningSoft,
    onTertiary: Tokens.warningForeground,
    error: Tokens.danger,
    errorContainer: Tokens.dangerSoft,
    onError: Tokens.dangerForeground,
    background: Tokens.background,
    onBackground: Tokens.foreground,
    surface: Tokens.surface,
    surfaceVariant: Tokens.surfaceSecondary,
    onSurface: Tokens.foreground,
    onSurfaceVariant: Tokens.muted,
    outline: Tokens.border,
    outlineVariant: Tokens.separator,
    shadow: '#000000',
    scrim: Tokens.backdrop,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: Tokens.radiusLg,
}

export type AppTheme = typeof theme
