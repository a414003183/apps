import { useRouter } from 'expo-router'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Avatar, Divider } from 'react-native-paper'
import { useAuthStore } from '../../src/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { fetchCustomerProfile } from '../../src/api/customer'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'

function QuickEntryCard({
  icon,
  label,
  count,
  onPress,
  color,
}: {
  icon: any
  label: string
  count?: number
  onPress: () => void
  color: string
}) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIconWrap, { backgroundColor: color + '18' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.quickContent}>
        {count !== undefined && <Text style={styles.quickCount}>{count}</Text>}
        <Text style={styles.quickLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}

function MenuItem({ icon, title, desc, onPress }: { icon: any; title: string; desc: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
      <Icon name={icon} size={20} color={Tokens.accent} />
      <View style={styles.menuContent}>
        <Text variant="bodyLarge" style={{ color: Tokens.foreground, fontWeight: '500' }}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.menuDesc}>
          {desc}
        </Text>
      </View>
      <Icon name="chevronRight" size={18} color={Tokens.muted} />
    </TouchableOpacity>
  )
}

export default function ProfileTab() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: fetchCustomerProfile,
    enabled: !!user,
  })

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Card */}
      <Card style={styles.userCard} padding="md">
        <View style={styles.userRow}>
          <Avatar.Text
            size={64}
            label={profile?.contactName?.charAt(0) || user?.displayName?.charAt(0) || '用'}
            style={{ backgroundColor: Tokens.accent }}
            color={Tokens.accentForeground}
          />
          <View style={styles.userInfo}>
            <Text variant="titleLarge" style={styles.userName}>
              {profile?.contactName || profile?.companyName || user?.displayName || '客户'}
            </Text>
            <Text variant="bodySmall" style={styles.userMeta}>
              {profile?.companyName ? `${profile.companyName}` : ''}
              {profile?.memberLevel ? ` · ${profile.memberLevel}` : ''}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Entries */}
      <View style={styles.quickGrid}>
        <QuickEntryCard icon="package" label="我的订单" onPress={() => router.push('/(tabs)/orders')} color={Tokens.accent} />
        <QuickEntryCard icon="user" label="我的资料" onPress={() => router.push('/profile/edit')} color={Tokens.success} />
        <QuickEntryCard icon="mapPin" label="收货地址" onPress={() => router.push('/profile/edit')} color={Tokens.warning} />
        <QuickEntryCard icon="shoppingCart" label="购物车" onPress={() => router.push('/(tabs)/cart')} color={Tokens.danger} />
      </View>

      {/* Address Section */}
      <Card header="默认收货地址" headerAction={{ label: '编辑', onPress: () => router.push('/profile/edit'), icon: 'chevronRight' }} padding="md">
        {profile?.defaultAddress?.receiverName ? (
          <View style={styles.addressInfo}>
            <Text variant="bodyMedium" style={styles.addressName}>
              {profile.defaultAddress.receiverName} {profile.defaultAddress.receiverPhone}
            </Text>
            <Text variant="bodySmall" style={styles.addressText}>
              {profile.defaultAddress.receiverProvince}
              {profile.defaultAddress.receiverCity}
              {profile.defaultAddress.receiverDistrict}
              {profile.defaultAddress.receiverAddress}
            </Text>
          </View>
        ) : (
          <Text variant="bodySmall" style={styles.noAddress}>
            暂无默认收货地址
          </Text>
        )}
      </Card>

      {/* Menu Section */}
      <Card style={styles.menuCard} padding="md">
        <MenuItem icon="package" title="我的订单" desc="查看所有订单" onPress={() => router.push('/(tabs)/orders')} />
        <Divider style={{ backgroundColor: Tokens.separator }} />
        <MenuItem icon="user" title="我的资料" desc="修改联系方式" onPress={() => router.push('/profile/edit')} />
      </Card>

      <View style={styles.appInfo}>
        <Text variant="bodySmall" style={styles.appVersion}>
          客户采购商城 v1.0.0
        </Text>
      </View>

      <Button variant="outline" fullWidth onPress={handleLogout} style={styles.logoutBtn}>
        退出登录
      </Button>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  userCard: {
    margin: 12,
    marginBottom: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontWeight: '600', marginBottom: 4, color: Tokens.foreground },
  userMeta: { color: Tokens.muted },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginVertical: 12,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Tokens.separator,
    ...Tokens.shadowSurface,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Tokens.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickContent: { flex: 1 },
  quickCount: { fontSize: 16, fontWeight: '700', color: Tokens.foreground },
  quickLabel: { fontSize: 12, color: Tokens.muted, marginTop: 2 },
  addressInfo: { gap: 4 },
  addressName: { fontWeight: '600', color: Tokens.foreground },
  addressText: { color: Tokens.muted, lineHeight: 20 },
  noAddress: { color: Tokens.muted },
  menuCard: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuContent: { flex: 1 },
  menuDesc: { color: Tokens.muted, marginTop: 2 },
  appInfo: { alignItems: 'center', marginVertical: 20 },
  appVersion: { color: Tokens.muted },
  logoutBtn: {
    marginHorizontal: 12,
    borderColor: Tokens.danger,
  },
})
