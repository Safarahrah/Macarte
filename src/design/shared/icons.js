// src/design/shared/icons.js
// Whitelisted symbol names (rendered client-side with lucide-react). The server
// sanitizer only accepts names from this list.
export const ICON_GROUPS = [
  { id: 'general', label: 'Général', icons: ['Star', 'Heart', 'Check', 'CheckCircle', 'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond', 'Sparkles', 'Zap', 'Award', 'Crown', 'Flag', 'Bookmark', 'Tag', 'Gift', 'Bell'] },
  { id: 'business', label: 'Entreprise', icons: ['Briefcase', 'Building', 'Building2', 'BarChart', 'TrendingUp', 'PieChart', 'Target', 'HeartHandshake', 'Lightbulb', 'Rocket', 'Shield', 'Lock', 'Key', 'Globe', 'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'CreditCard', 'ShoppingBag', 'ShoppingCart', 'Store', 'Truck', 'Package'] },
  { id: 'food', label: 'Restauration', icons: ['Coffee', 'Pizza', 'Utensils', 'UtensilsCrossed', 'Wine', 'Beer', 'Cake', 'Croissant', 'IceCream', 'Apple', 'Cherry', 'ChefHat', 'Soup', 'Salad'] },
  { id: 'nature', label: 'Nature', icons: ['Leaf', 'Flower', 'Flower2', 'Trees', 'TreePine', 'Sun', 'Moon', 'Cloud', 'Droplet', 'Flame', 'Mountain', 'Waves', 'Snowflake', 'Sprout'] },
  { id: 'health', label: 'Santé & bien-être', icons: ['HeartPulse', 'Stethoscope', 'Activity', 'Smile', 'Baby', 'Dumbbell', 'Bike', 'Footprints', 'Pill', 'Scissors', 'Brush'] },
  { id: 'tech', label: 'Technologie', icons: ['Code', 'Cpu', 'Monitor', 'Smartphone', 'Laptop', 'Wifi', 'Database', 'Server', 'Terminal', 'Bot', 'Camera', 'Video', 'Mic', 'Headphones', 'Music', 'Gamepad2'] },
  { id: 'home', label: 'Maison & services', icons: ['Home', 'Hammer', 'Wrench', 'Paintbrush', 'Palette', 'Car', 'Plane', 'Ship', 'GraduationCap', 'BookOpen', 'PenTool', 'Feather', 'Anchor', 'Compass', 'Map', 'Users', 'User', 'Dog', 'Cat', 'Bone', 'Fish', 'Gem'] },
  { id: 'arrows', label: 'Flèches', icons: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronsRight', 'MoveRight', 'Plus', 'Minus', 'X', 'Quote', 'Info', 'AlertCircle', 'ThumbsUp', 'Share2', 'Link', 'QrCode', 'Instagram', 'Facebook', 'Linkedin', 'Twitter', 'Youtube'] }
];

export const ICON_NAMES = ICON_GROUPS.flatMap((g) => g.icons);
