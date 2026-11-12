import {
  Banknote,
  Briefcase,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

/** Icons a category can use. The database stores the key (e.g. 'utensils'). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  tag: Tag,
  banknote: Banknote,
  wallet: Wallet,
  laptop: Laptop,
  briefcase: Briefcase,
  gift: Gift,
  house: House,
  plane: Plane,
  coffee: Coffee,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Tag;
}

/** Colors a category can use (no free-form hex input). */
export const CATEGORY_COLORS = [
  '#E67E22', '#3498DB', '#9B59B6', '#E74C3C', '#E91E63',
  '#1ABC9C', '#F39C12', '#7F8C8D', '#27AE60', '#2980B9',
] as const;

export const DEFAULT_CATEGORY_COLOR = '#7F8C8D';
