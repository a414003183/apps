import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ViewStyle,
  StyleProp,
} from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { Tokens } from '../../theme'
import { getImageUrl } from '../../utils/image'
import { Chip } from '../ui/Chip'
import type { Product } from '../../types/api'

interface ProductCardProps {
  product: Product
  width?: number
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export function ProductCard({ product, width, style, onPress }: ProductCardProps) {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const cardWidth = width ?? (screenWidth - 32 - 12) / 2

  const imageUrl = getImageUrl(product.mainImageId)
  const memberPrice = product.memberPrice || product.price
  const originalPrice = product.price
  const hasDiscount = originalPrice > memberPrice

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }
    router.push(`/product/${product.merchantGoodsId}`)
  }

  const handleShopPress = () => {
    router.push(`/shop/${product.merchantId}` as any)
  }

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }, style]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.imageBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.placeholder}>暂无图片</Text>
        )}

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>¥{memberPrice.toFixed(2)}</Text>
        </View>

        {product.badge ? (
          <View style={styles.badge}>
            <Chip variant="accent" compact>
              {product.badge}
            </Chip>
          </View>
        ) : null}

        {product.stock <= 0 && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>售罄</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text variant="bodySmall" numberOfLines={1} style={styles.name}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text variant="titleSmall" style={styles.price}>
            ¥{memberPrice.toFixed(2)}
          </Text>
          {hasDiscount ? (
            <Text variant="bodySmall" style={styles.originalPrice}>
              ¥{originalPrice.toFixed(2)}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleShopPress} activeOpacity={0.7} style={styles.shopWrap}>
            <Text style={styles.shopName} numberOfLines={1}>
              {product.shopName}
            </Text>
          </TouchableOpacity>
          <Text style={styles.sales}>{product.saleCount ?? 0}付款</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.surface,
    borderRadius: Tokens.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Tokens.separator,
    ...Tokens.shadowSurface,
  },
  imageBox: {
    aspectRatio: 2 / 1,
    backgroundColor: Tokens.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    fontSize: 13,
    color: Tokens.muted,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Tokens.accent,
    borderRadius: Tokens.radius,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceBadgeText: {
    color: Tokens.accentForeground,
    fontSize: 10,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  soldOut: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 12,
    color: Tokens.foreground,
    marginBottom: 4,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    color: Tokens.price,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  originalPrice: {
    color: Tokens.muted,
    textDecorationLine: 'line-through',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopWrap: {
    flex: 1,
    marginRight: 8,
  },
  shopName: {
    fontSize: 11,
    color: Tokens.accent,
    fontWeight: '500',
  },
  sales: {
    fontSize: 10,
    color: Tokens.muted,
  },
})
