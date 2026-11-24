import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  Enquiry,
  FoodCategory,
  FoodItem,
  Order,
  OrderItem,
  RestaurantSettings,
} from '../src/types';

export interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string; // format: salt:hex
  mustChangePassword: boolean;
  createdAt: string;
}

export interface DatabaseState {
  admin: AdminRecord | null;
  categories: FoodCategory[];
  foods: FoodItem[];
  orders: Order[];
  orderItems: OrderItem[];
  enquiries: Enquiry[];
  settings: RestaurantSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function buildSeedState(): DatabaseState {
  const now = new Date().toISOString();

  const categories: FoodCategory[] = [
    { id: 'cat-rice', name: 'Rice Dishes', slug: 'rice-dishes', sort_order: 1, created_at: now },
    {
      id: 'cat-beans',
      name: 'Beans and Local Delicacies',
      slug: 'beans-and-local-delicacies',
      sort_order: 2,
      created_at: now,
    },
    {
      id: 'cat-soups',
      name: 'Soups and Swallows',
      slug: 'soups-and-swallows',
      sort_order: 3,
      created_at: now,
    },
    { id: 'cat-special', name: 'Special Meals', slug: 'special-meals', sort_order: 4, created_at: now },
    { id: 'cat-drinks', name: 'Drinks', slug: 'drinks', sort_order: 5, created_at: now },
  ];

  const foods: FoodItem[] = [
    // Rice Dishes
    {
      id: 'food-jollof',
      name: 'Nigerian Jollof Rice',
      description:
        'Deliciously prepared Nigerian party-style jollof rice, rich in flavour and served fresh.',
      price: 2500,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_jollof_rice_1795437995663.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-fried-rice',
      name: 'Fried Rice',
      description:
        'Tasty Nigerian fried rice prepared with fresh vegetables and carefully selected ingredients.',
      price: 3000,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_fried_rice_1795437995125.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-white-rice-stew',
      name: 'White Rice and Stew',
      description:
        'Freshly cooked white rice served with rich, homemade Nigerian tomato stew.',
      price: 2500,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_white_rice_stew_1795437994701.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-ofada',
      name: 'Ofada Rice and Sauce',
      description: 'Local Nigerian rice served with delicious, spicy ayamase-style sauce.',
      price: 3500,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_ofada_rice_1795437997200.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-coconut-rice',
      name: 'Coconut Rice',
      description: 'Fragrant long-grain rice simmered gently in rich coconut milk and Nigerian spices.',
      price: 3000,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_fried_rice_1795437995125.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-native-rice',
      name: 'Native Rice',
      description:
        'Traditional palm-oil rice cooked with locust beans, dried fish, and authentic local seasonings.',
      price: 3500,
      category_id: 'cat-rice',
      image_url: '/src/assets/images/dish_ofada_rice_1795437997200.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },

    // Beans and Local Delicacies
    {
      id: 'food-ewa-agoyin',
      name: 'Ewa Agoyin',
      description:
        'Soft, well-cooked beans served with delicious traditional agoyin pepper sauce.',
      price: 2000,
      category_id: 'cat-beans',
      image_url: '/src/assets/images/dish_ewa_agoyin_1795437995215.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-beans-plantain',
      name: 'Beans and Plantain',
      description: 'Deliciously cooked beans served with sweet fried ripe plantain.',
      price: 2500,
      category_id: 'cat-beans',
      image_url: '/src/assets/images/dish_beans_plantain_1795437995397.jpg',
      is_available: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-yam-egg',
      name: 'Yam and Egg Sauce',
      description:
        'Soft boiled white yam slices served with rich, savoury Nigerian tomato and egg sauce.',
      price: 2500,
      category_id: 'cat-beans',
      image_url: '/src/assets/images/dish_white_rice_stew_1795437994701.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-moi-moi',
      name: 'Moi Moi',
      description:
        'Freshly steamed Nigerian bean pudding blended with peppers, onions, and spices.',
      price: 1000,
      category_id: 'cat-beans',
      image_url: '/src/assets/images/dish_moi_moi_akara_1795437995258.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-akara',
      name: 'Akara',
      description: 'Crispy, golden-fried Nigerian bean cakes made fresh to order.',
      price: 1000,
      category_id: 'cat-beans',
      image_url: '/src/assets/images/dish_moi_moi_akara_1795437995258.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },

    // Soups and Swallows
    {
      id: 'food-egusi-eba',
      name: 'Egusi Soup and Eba',
      description:
        'Rich melon seed soup cooked with leafy greens and assorted meat, paired with smooth Eba.',
      price: 3500,
      category_id: 'cat-soups',
      image_url: '/src/assets/images/dish_egusi_eba_1795437995930.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-efo-amala',
      name: 'Efo Riro and Amala',
      description:
        'Savory Yoruba-style spinach stew rich with locust beans and meat, served with hot Amala.',
      price: 3500,
      category_id: 'cat-soups',
      image_url: '/src/assets/images/dish_efo_amala_1795437995289.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-ogbono-pounded-yam',
      name: 'Ogbono Soup and Pounded Yam',
      description: 'Smooth traditional Ogbono draw soup served with freshly pounded yam swallow.',
      price: 4000,
      category_id: 'cat-soups',
      image_url: '/src/assets/images/dish_egusi_eba_1795437995930.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-veg-eba',
      name: 'Vegetable Soup and Eba',
      description: 'Freshly prepared Nigerian green vegetable soup served alongside warm yellow Eba.',
      price: 3500,
      category_id: 'cat-soups',
      image_url: '/src/assets/images/dish_efo_amala_1795437995289.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },

    // Special Meals
    {
      id: 'food-jollof-chicken',
      name: 'Jollof Rice with Chicken',
      description:
        'Smoky party Jollof rice served with tender seasoned chicken and golden fried plantain.',
      price: 4000,
      category_id: 'cat-special',
      image_url: '/src/assets/images/hero_jollof_feast_1795437995489.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-fried-rice-chicken',
      name: 'Fried Rice with Chicken',
      description: 'Flavourful Nigerian vegetable fried rice paired with spiced roasted chicken.',
      price: 4500,
      category_id: 'cat-special',
      image_url: '/src/assets/images/dish_fried_rice_1795437995125.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-rice-beef-plantain',
      name: 'Rice with Beef and Plantain',
      description: 'Generous serving of rice paired with tender stewed beef and sweet fried plantain.',
      price: 4000,
      category_id: 'cat-special',
      image_url: '/src/assets/images/dish_white_rice_stew_1795437994701.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },

    // Drinks
    {
      id: 'food-water',
      name: 'Bottled Water',
      description: 'Chilled pure spring bottled water.',
      price: 500,
      category_id: 'cat-drinks',
      image_url: '/src/assets/images/dish_zobo_drink_1795437997143.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-soft-drinks',
      name: 'Soft Drinks',
      description: 'Assorted chilled carbonated soft drinks.',
      price: 700,
      category_id: 'cat-drinks',
      image_url: '/src/assets/images/dish_zobo_drink_1795437997143.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'food-zobo',
      name: 'Zobo',
      description:
        'Freshly brewed chilled Nigerian hibiscus flower drink infused with pineapple and ginger.',
      price: 1000,
      category_id: 'cat-drinks',
      image_url: '/src/assets/images/dish_zobo_drink_1795437997143.jpg',
      is_available: true,
      is_featured: false,
      created_at: now,
      updated_at: now,
    },
  ];

  const settings: RestaurantSettings = {
    id: 'default-settings',
    restaurant_name: 'Unique Restaurant',
    description:
      'Unique Restaurant specializes in preparing and serving delicious, freshly prepared Nigerian meals in Owo Ede, Osogbo, Osun State.',
    whatsapp_number: '2349067566746',
    phone_number: '+234 906 756 6746',
    location: 'Owo Ede, Osogbo, Osun State, Nigeria',
    opening_hours: 'Opening hours editable via Admin Dashboard',
    delivery_fee: 500,
    currency_symbol: '₦',
    logo_url: null,
    hero_image_url: '/src/assets/images/hero_jollof_feast_1795437995489.jpg',
    hero_heading: 'Delicious Nigerian Meals, Made With Love.',
    hero_subtext:
      "Experience the rich taste of authentic Nigerian cuisine. From delicious rice dishes to traditional local delicacies, there's always something special waiting for you at Unique Restaurant.",
    about_story:
      'At Unique Restaurant, we believe that good food brings people together. Our passion is serving delicious Nigerian meals prepared with care, quality ingredients, and a commitment to satisfying every customer.\n\nFrom popular rice dishes to traditional Nigerian delicacies, we aim to give every customer a memorable food experience.\n\nLocated in Owo Ede, Osogbo, Unique Restaurant is dedicated to making delicious Nigerian food accessible to everyone.',
    mission_statement:
      'To serve delicious, affordable, and satisfying Nigerian meals while creating a welcoming experience for every customer.',
    vision_statement:
      'To become a trusted and recognized food destination known for quality, great taste, and excellent customer satisfaction.',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    updated_at: now,
  };

  return {
    admin: null,
    categories,
    foods,
    orders: [],
    orderItems: [],
    enquiries: [],
    settings,
  };
}

export function readDb(): DatabaseState {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = buildSeedState();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    parsed.orders = (parsed.orders || []).map((o) => ({
      ...o,
      payment_status: o.payment_status || 'pending_payment',
      payment_verified_at: o.payment_verified_at ?? null,
      updated_at: o.updated_at || o.created_at,
    }));
    return parsed;
  } catch {
    const fallback = buildSeedState();
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

export function writeDb(state: DatabaseState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}
