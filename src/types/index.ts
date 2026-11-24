export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending_payment' | 'paid' | 'refunded';
export type DeliveryType = 'delivery' | 'pickup';

export interface FoodCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  category?: FoodCategory | null;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_id: string | null;
  food_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  preferred_delivery_time: string | null;
  additional_instructions: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_verified_at?: string | null;
  order_source: string;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

export interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  restaurant_name: string;
  description: string;
  whatsapp_number: string;
  phone_number: string;
  location: string;
  opening_hours: string;
  delivery_fee: number;
  currency_symbol: string;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_heading: string;
  hero_subtext: string;
  about_story: string;
  mission_statement: string;
  vision_statement: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  mustChangePassword: boolean;
}

export interface OverviewStats {
  totalFoods: number;
  availableMeals: number;
  unavailableMeals: number;
  totalOrders: number;
  verifiedRevenue: number;
  unreadEnquiries: number;
  recentFoods: FoodItem[];
  recentEnquiries: Enquiry[];
  foods: FoodItem[];
  categories: FoodCategory[];
  orders: Order[];
  enquiries: Enquiry[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
