import React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Heart,
  Home,
  LayoutGrid,
  LockKeyhole,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react-native'
import { Tokens } from '../../theme'

const ICONS = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  building2: Building2,
  chevronRight: ChevronRight,
  clock: Clock,
  eye: Eye,
  eyeOff: EyeOff,
  heart: Heart,
  home: Home,
  layoutGrid: LayoutGrid,
  lockKeyhole: LockKeyhole,
  mail: Mail,
  mapPin: MapPin,
  minus: Minus,
  package: Package,
  phone: Phone,
  plus: Plus,
  search: Search,
  settings: Settings,
  shieldCheck: ShieldCheck,
  shoppingCart: ShoppingCart,
  store: Store,
  trash2: Trash2,
  truck: Truck,
  upload: Upload,
  user: User,
  users: Users,
  x: X,
} as const

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}

export function Icon({ name, size = 20, color = Tokens.foreground, strokeWidth = 1.5 }: IconProps) {
  const Component = ICONS[name]
  return <Component width={size} height={size} color={color} strokeWidth={strokeWidth} />
}
