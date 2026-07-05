import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Card } from './Card'
import { Button } from './Button'
import { Icon, IconName } from './Icon'
import { Tokens } from '../../theme'

interface StatePanelAction {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

interface StatePanelProps {
  icon?: IconName
  eyebrow?: string
  title: string
  description?: string
  primaryAction?: StatePanelAction
  secondaryAction?: StatePanelAction
}

export function StatePanel({
  icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}: StatePanelProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card} padding="lg">
        {icon ? (
          <View style={styles.iconWrap}>
            <Icon name={icon} size={40} color={Tokens.accent} />
          </View>
        ) : null}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text variant="bodyMedium" style={styles.description}>
            {description}
          </Text>
        ) : null}

        {(primaryAction || secondaryAction) && (
          <View style={styles.actions}>
            {secondaryAction && (
              <Button variant="outline" size="md" onPress={secondaryAction.onPress} style={styles.btn}>
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button variant="primary" size="md" onPress={primaryAction.onPress} style={styles.btn}>
                {primaryAction.label}
              </Button>
            )}
          </View>
        )}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Tokens.background,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Tokens.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: Tokens.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: Tokens.foreground,
    textAlign: 'center',
  },
  description: {
    color: Tokens.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
})
