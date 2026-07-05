import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native'
import { Tokens } from '../../theme'
import { Icon, IconName } from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  icon?: IconName
  iconRight?: boolean
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconRight = false,
  style,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const variantStyle = VARIANTS[variant]
  const sizeStyle = SIZES[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && variantStyle.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.loadingColor} />
      ) : (
        <View style={styles.content}>
          {icon && !iconRight && <Icon name={icon} size={sizeStyle.iconSize} color={variantStyle.textColor} />}
          <Text
            style={[
              styles.text,
              { color: variantStyle.textColor, fontSize: sizeStyle.fontSize },
              icon && !iconRight && { marginLeft: 6 },
              icon && iconRight && { marginRight: 6 },
            ]}
          >
            {children}
          </Text>
          {icon && iconRight && <Icon name={icon} size={sizeStyle.iconSize} color={variantStyle.textColor} />}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Tokens.radius,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
})

const SIZES = {
  sm: { container: { paddingHorizontal: 12, paddingVertical: 6 }, fontSize: 12, iconSize: 14 },
  md: { container: { paddingHorizontal: 16, paddingVertical: 10 }, fontSize: 14, iconSize: 16 },
  lg: { container: { paddingHorizontal: 20, paddingVertical: 13 }, fontSize: 15, iconSize: 18 },
}

const VARIANTS = {
  primary: {
    container: { backgroundColor: Tokens.accent },
    textColor: Tokens.accentForeground,
    loadingColor: Tokens.accentForeground,
    disabled: { backgroundColor: Tokens.default, opacity: 0.6 },
  },
  secondary: {
    container: { backgroundColor: Tokens.accentSoft },
    textColor: Tokens.accent,
    loadingColor: Tokens.accent,
    disabled: { backgroundColor: Tokens.default, opacity: 0.6 },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: Tokens.foreground,
    loadingColor: Tokens.foreground,
    disabled: { opacity: 0.4 },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Tokens.border },
    textColor: Tokens.foreground,
    loadingColor: Tokens.foreground,
    disabled: { opacity: 0.4 },
  },
  danger: {
    container: { backgroundColor: Tokens.danger },
    textColor: Tokens.dangerForeground,
    loadingColor: Tokens.dangerForeground,
    disabled: { backgroundColor: Tokens.default, opacity: 0.6 },
  },
}
