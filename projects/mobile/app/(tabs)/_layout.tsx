import { Tabs } from 'expo-router'
import { useCartStore } from '../../src/store/cartStore'
import { View, Text } from 'react-native'
import { Icon } from '../../src/components/ui/Icon'
import { Tokens } from '../../src/theme'

function CartBadge() {
  const items = useCartStore(s => s.items)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  if (count === 0) return null
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: Tokens.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  )
}

function TabIcon({ name, color }: { name: any; color: string }) {
  return <Icon name={name} size={22} color={color} />
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Tokens.accent,
        tabBarInactiveTintColor: Tokens.muted,
        tabBarStyle: {
          backgroundColor: Tokens.surface,
          borderTopColor: Tokens.separator,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Tokens.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Tokens.separator,
        },
        headerTintColor: Tokens.foreground,
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: Tokens.foreground },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: '分类',
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="layoutGrid" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: '购物车',
          tabBarIcon: ({ color }: { color: string }) => (
            <View style={{ position: 'relative' }}>
              <TabIcon name="shoppingCart" color={color} />
              <CartBadge />
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: '订单',
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="package" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="user" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  )
}
