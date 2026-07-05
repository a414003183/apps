import React from 'react'
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps as RNTextInputProps, TouchableOpacity } from 'react-native'
import { Tokens } from '../../theme'
import { Icon, IconName } from './Icon'

interface InputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string
  icon?: IconName
  error?: string
  containerStyle?: any
}

export function Input({ label, icon, error, containerStyle, secureTextEntry, keyboardType, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.wrap,
          isFocused && styles.wrapFocused,
          error && styles.wrapError,
        ]}
      >
        {icon && <Icon name={icon} size={16} color={Tokens.muted} />}
        <RNTextInput
          style={styles.input}
          placeholderTextColor={Tokens.muted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} color={Tokens.muted} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: Tokens.muted,
    marginBottom: 6,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.separator,
    borderRadius: Tokens.radius,
    paddingHorizontal: 12,
    backgroundColor: Tokens.surface,
    minHeight: 48,
  },
  wrapFocused: {
    borderColor: Tokens.accent,
  },
  wrapError: {
    borderColor: Tokens.danger,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Tokens.foreground,
    paddingVertical: 12,
    marginLeft: 8,
  },
  eyeBtn: {
    padding: 6,
  },
  error: {
    color: Tokens.danger,
    fontSize: 12,
    marginTop: 4,
  },
})
