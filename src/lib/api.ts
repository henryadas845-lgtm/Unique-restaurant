import { isSupabaseConfigured, supabase } from './supabase';
import type {
  AdminUser,
  DeliveryType,
  Enquiry,
  FoodCategory,
  FoodItem,
  Order,
  OrderStatus,
  OverviewStats,
  PaymentStatus,
  RestaurantSettings,
} from '../types';

function normalizeOrder(row: Order): Order {
  return {
    ...row,
    payment_status: row.payment_status || 'pending_payment',
    payment_verified_at: row.payment_verified_at ?? null,
    updated_at: row.updated_at || row.created_at,
  };
}

let inMemoryToken: string | null = null;

export function setInMemoryAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function getInMemoryAuthToken(): string | null {
  return inMemoryToken;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Database connection is not configured for this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting Environment Variables and redeploy.'
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  preferred_delivery_time?: string;
  additional_instructions?: string;
  items: { food_id: string; quantity: number }[];
}

export interface CreateEnquiryInput {
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
}

export const dataService = {
  async fetchPublicBootstrap(): Promise<{
    settings: RestaurantSettings;
    categories: FoodCategory[];
    foods: FoodItem[];
  }> {
    if (isSupabaseConfigured && supabase) {
      const [settingsRes, categoriesRes, foodsRes] = await Promise.all([
        supabase.from('restaurant_settings').select('*').limit(1).maybeSingle(),
        supabase.from('food_categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('foods')
          .select('*, category:food_categories(*)')
          .order('created_at', { ascending: false }),
      ]);

      if (settingsRes.error) throw new Error(settingsRes.error.message);
      if (categoriesRes.error) throw new Error(categoriesRes.error.message);
      if (foodsRes.error) throw new Error(foodsRes.error.message);

      if (!settingsRes.data) {
        throw new Error(
          'Restaurant settings have not been seeded in Supabase yet. Run supabase/seed.sql.'
        );
      }

      return {
        settings: settingsRes.data as RestaurantSettings,
        categories: (categoriesRes.data || []) as FoodCategory[],
        foods: (foodsRes.data || []) as FoodItem[],
      };
    }

    return apiFetch('/api/public/bootstrap');
  },

  async submitOrderRequest(
    input: CreateOrderInput,
    foodsCatalog: FoodItem[],
    settings: RestaurantSettings
  ): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const orderId = crypto.randomUUID();
      const foodMap = new Map(foodsCatalog.map((f) => [f.id, f]));
      let subtotal = 0;

      const itemsToInsert = input.items.map((item) => {
        const food = foodMap.get(item.food_id);
        if (!food) throw new Error('Selected meal could not be found.');
        if (!food.is_available) throw new Error(`${food.name} is currently unavailable.`);
        const lineSubtotal = Number(food.price) * item.quantity;
        subtotal += lineSubtotal;
        return {
          id: crypto.randomUUID(),
          order_id: orderId,
          food_id: food.id,
          food_name: food.name,
          unit_price: Number(food.price),
          quantity: item.quantity,
          subtotal: lineSubtotal,
        };
      });

      const deliveryFee =
        input.delivery_type === 'delivery' ? Number(settings.delivery_fee || 0) : 0;
      const totalAmount = subtotal + deliveryFee;

      const orderRow = {
        id: orderId,
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone.trim(),
        delivery_type: input.delivery_type,
        delivery_address:
          input.delivery_type === 'delivery' ? input.delivery_address?.trim() || null : null,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        preferred_delivery_time: input.preferred_delivery_time?.trim() || null,
        additional_instructions: input.additional_instructions?.trim() || null,
        status: 'pending' as OrderStatus,
        payment_status: 'pending_payment' as PaymentStatus,
        order_source: 'whatsapp_request',
      };

      let { error: orderErr } = await supabase.from('orders').insert(orderRow);
      if (orderErr && orderErr.message.includes('payment_status')) {
        const { payment_status: _ps, ...legacyOrderRow } = orderRow;
        const retry = await supabase.from('orders').insert(legacyOrderRow);
        orderErr = retry.error;
      }
      if (orderErr) throw new Error(orderErr.message);

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw new Error(itemsErr.message);

      return {
        ...orderRow,
        created_at: new Date().toISOString(),
        order_items: itemsToInsert,
      };
    }

    const res = await apiFetch<{ order: Order }>('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.order;
  },

  async submitEnquiry(input: CreateEnquiryInput): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('enquiries').insert({
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone.trim(),
        subject: input.subject.trim(),
        message: input.message.trim(),
        is_read: false,
      });
      if (error) throw new Error(error.message);
      return;
    }

    await apiFetch('/api/public/enquiries', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getAuthStatus(): Promise<{ needsInitialSetup: boolean }> {
    if (isSupabaseConfigured) {
      return { needsInitialSetup: false };
    }
    return apiFetch('/api/admin/auth-status');
  },

  async claimInitialAdmin(password: string): Promise<AdminUser> {
    const res = await apiFetch<{ token: string; user: AdminUser }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setInMemoryAuthToken(res.token);
    return res.user;
  },

  async loginAdmin(password: string, email?: string): Promise<AdminUser> {
    if (isSupabaseConfigured && supabase) {
      const targetEmail =
        email?.trim() ||
        (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim() ||
        'admin@uniquerestaurant.ng';

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });
      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid admin password');
      }

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, role, must_change_password')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profErr || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('This account does not have administrator privileges.');
      }

      const mustChange = Boolean(
        profile.must_change_password || data.user.user_metadata?.must_change_password
      );

      return {
        id: profile.id,
        email: profile.email,
        role: 'admin',
        mustChangePassword: mustChange,
      };
    }

    const res = await apiFetch<{ token: string; user: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setInMemoryAuthToken(res.token);
    return res.user;
  },

  async restoreSupabaseSession(): Promise<AdminUser | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, must_change_password')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.role !== 'admin') return null;
    return {
      id: profile.id,
      email: profile.email,
      role: 'admin',
      mustChangePassword: Boolean(
        profile.must_change_password || user.user_metadata?.must_change_password
      ),
    };
  },

  async changeAdminPassword(
    currentPassword: string,
    newPassword: string,
    userId: string
  ): Promise<AdminUser> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error('Session expired');

      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthErr) throw new Error('Current password is incorrect.');

      const { error: updErr } = await supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      });
      if (updErr) throw new Error(updErr.message);

      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId);

      return {
        id: userId,
        email,
        role: 'admin',
        mustChangePassword: false,
      };
    }

    const res = await apiFetch<{ user: AdminUser }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.user;
  },

  async logoutAdmin(): Promise<void> {
    setInMemoryAuthToken(null);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },

  async getOverviewStats(): Promise<OverviewStats> {
    if (isSupabaseConfigured && supabase) {
      const [foodsRes, categoriesRes, ordersRes, enquiriesRes] = await Promise.all([
        supabase
          .from('foods')
          .select('*, category:food_categories(*)')
          .order('created_at', { ascending: false }),
        supabase.from('food_categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false }),
        supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
      ]);

      if (foodsRes.error) throw new Error(foodsRes.error.message);
      if (categoriesRes.error) throw new Error(categoriesRes.error.message);
      if (ordersRes.error) throw new Error(ordersRes.error.message);
      if (enquiriesRes.error) throw new Error(enquiriesRes.error.message);

      const foods = (foodsRes.data || []) as FoodItem[];
      const categories = (categoriesRes.data || []) as FoodCategory[];
      const orders = ((ordersRes.data || []) as Order[]).map(normalizeOrder);
      const enquiries = (enquiriesRes.data || []) as Enquiry[];

      const verifiedRevenue = orders
        .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        totalFoods: foods.length,
        availableMeals: foods.filter((f) => f.is_available).length,
        unavailableMeals: foods.filter((f) => !f.is_available).length,
        totalOrders: orders.length,
        verifiedRevenue,
        unreadEnquiries: enquiries.filter((e) => !e.is_read).length,
        recentFoods: foods.slice(0, 6),
        recentEnquiries: enquiries.slice(0, 6),
        foods,
        categories,
        orders,
        enquiries,
      };
    }

    const res = await apiFetch<OverviewStats>('/api/admin/overview');
    return {
      ...res,
      orders: (res.orders || []).map(normalizeOrder),
    };
  },

  async uploadImage(file: File, bucket: 'food-images' | 'restaurant-assets'): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are supported.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be 5MB or smaller.');
    }

    if (isSupabaseConfigured && supabase) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    }

    const dataUrl = await fileToDataUrl(file);
    const res = await apiFetch<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    });
    return res.url;
  },

  async createFood(payload: {
    name: string;
    description: string;
    price: number;
    category_id: string | null;
    image_url: string;
    is_available: boolean;
    is_featured: boolean;
  }): Promise<FoodItem> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('foods')
        .insert(payload)
        .select('*, category:food_categories(*)')
        .single();
      if (error) throw new Error(error.message);
      return data as FoodItem;
    }
    const res = await apiFetch<{ food: FoodItem }>('/api/admin/foods', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.food;
  },

  async updateFood(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      price: number;
      category_id: string | null;
      image_url: string;
      is_available: boolean;
      is_featured: boolean;
    }>
  ): Promise<FoodItem> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('foods')
        .update(payload)
        .eq('id', id)
        .select('*, category:food_categories(*)')
        .single();
      if (error) throw new Error(error.message);
      return data as FoodItem;
    }
    const res = await apiFetch<{ food: FoodItem }>(`/api/admin/foods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.food;
  },

  async deleteFood(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('foods').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await apiFetch(`/api/admin/foods/${id}`, { method: 'DELETE' });
  },

  async createCategory(payload: {
    name: string;
    slug: string;
    sort_order: number;
  }): Promise<FoodCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('food_categories')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as FoodCategory;
    }
    const res = await apiFetch<{ category: FoodCategory }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.category;
  },

  async updateCategory(
    id: string,
    payload: Partial<{ name: string; slug: string; sort_order: number }>
  ): Promise<FoodCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('food_categories')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as FoodCategory;
    }
    const res = await apiFetch<{ category: FoodCategory }>(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.category;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('food_categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
  },

  async fetchOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return ((data || []) as Order[]).map(normalizeOrder);
    }
    const res = await apiFetch<{ orders: Order[] }>('/api/admin/orders');
    return res.orders.map(normalizeOrder);
  },

  async updateOrder(
    id: string,
    payload: { status?: OrderStatus; payment_status?: PaymentStatus }
  ): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const updateBody: Record<string, unknown> = { ...payload };
      if (payload.payment_status === 'paid') {
        updateBody.payment_verified_at = new Date().toISOString();
      } else if (payload.payment_status) {
        updateBody.payment_verified_at = null;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateBody)
        .eq('id', id)
        .select('*, order_items(*)')
        .single();
      if (error) throw new Error(error.message);
      return normalizeOrder(data as Order);
    }
    const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeOrder(res.order);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.updateOrder(id, { status });
  },

  async fetchEnquiries(): Promise<Enquiry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Enquiry[];
    }
    const res = await apiFetch<{ enquiries: Enquiry[] }>('/api/admin/enquiries');
    return res.enquiries;
  },

  async toggleEnquiryRead(id: string, is_read: boolean): Promise<Enquiry> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enquiries')
        .update({ is_read })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Enquiry;
    }
    const res = await apiFetch<{ enquiry: Enquiry }>(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read }),
    });
    return res.enquiry;
  },

  async deleteEnquiry(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('enquiries').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await apiFetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
  },

  async updateSettings(
    settingsId: string,
    payload: Partial<RestaurantSettings>
  ): Promise<RestaurantSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update(payload)
        .eq('id', settingsId)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as RestaurantSettings;
    }
    const res = await apiFetch<{ settings: RestaurantSettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.settings;
  },
};
