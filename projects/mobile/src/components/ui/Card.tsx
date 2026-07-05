import React from 'react'
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native'
import { Text } from 'react-native-paper'
import { Tokens } from '../../theme'
import { Icon, IconName } from './Icon'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  header?: string
  headerAction?: { label: string; onPress?: () => void; icon?: IconName }
  noBorder?: boolean
  noShadow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onPress?: () => void
}

const PADDING = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 18,
}

export function Card({
  children,
  style,
  header,
  headerAction,
  noBorder,
  noShadow,
  padding = 'md',
  onPress,
}: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        noBorder && { borderWidth: 0 },
        noShadow && { shadowOpacity: 0, elevation: 0 },
        { padding: PADDING[padding] },
        style,
      ]}
    >
      {header ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{header}</Text>
          {headerAction ? (
            <TouchableOpacity onPress={headerAction.onPress} style={styles.headerActionRow}>
              <Text style={styles.headerAction}>{headerAction.label}</Text>
              {headerAction.icon && <Icon name={headerAction.icon} size={14} color={Tokens.accent} />}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

interface CardHeaderProps {
  title: string
  action?: { label: string; onPress?: () => void; icon?: IconName }
  children?: React.ReactNode
}

export function CardHeader({ title, action, children }: CardHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {children}
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={styles.headerActionRow}>
          <Text style={styles.headerAction}>{action.label}</Text>
          {action.icon && <Icon name={action.icon} size={14} color={Tokens.accent} />}
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    borderWidth: 1,
    borderColor: Tokens.separator,
    ...Tokens.shadowSurface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.separator,
  },
  headerTitle: {
    fontWeight: '700',
    color: Tokens.foreground,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerAction: {
    color: Tokens.accent,
    fontSize: 13,
    fontWeight: '500',
  },
})
