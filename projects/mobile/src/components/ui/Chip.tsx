import React from 'react'
import { TouchableOpacity, View, StyleSheet, ViewStyle, StyleProp } from 'react-native'
import { Text } from 'react-native-paper'
import { Tokens } from '../../theme'

type ChipVariant = 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'default' | 'secondary' | 'tertiary'

interface ChipProps {
  children: React.ReactNode
  variant?: ChipVariant
  compact?: boolean
  style?: StyleProp<ViewStyle>
  selected?: boolean
  onPress?: () => void
}

const variantStyles: Record<ChipVariant, { bg: string; text: string; border?: string }> = {
  accent: { bg: Tokens.accentSoft, text: Tokens.accent },
  primary: { bg: Tokens.accent, text: Tokens.accentForeground },
  success: { bg: Tokens.successSoft, text: Tokens.successDark as string },
  warning: { bg: Tokens.warningSoft, text: Tokens.warningDark as string },
  danger: { bg: Tokens.dangerSoft, text: Tokens.danger },
  default: { bg: Tokens.default, text: Tokens.muted },
  secondary: { bg: Tokens.accentSoft, text: Tokens.accent },
  tertiary: { bg: Tokens.surfaceSecondary, text: Tokens.foreground },
}

export function Chip({ children, variant = 'default', compact, style, selected: _selected, onPress }: ChipProps) {
  const v = variantStyles[variant]
  const content = (
    <View
      style={[
        styles.chip,
        { backgroundColor: v.bg, borderColor: v.border || v.bg },
        compact && styles.compact,
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }, compact && styles.textCompact]}>{children}</Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Tokens.radiusFull,
    borderWidth: 1,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
  },
})
