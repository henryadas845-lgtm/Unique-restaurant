import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FolderTree,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { FoodImage } from '../components/FoodImage';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import type { Order, OrderStatus, OverviewStats, PaymentStatus } from '../types';
import { formatDateTime, formatNaira } from '../utils/format';
import { AdminLayout } from './AdminLayout';
import {
  CategoryDoughnutChart,
  OrdersBarChart,
  RevenueLineChart,
} from './components/DashboardCharts';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  isCompletedOrderStatus,
  isPendingOrderStatus,
} from './components/OrderBadges';
import { OrderDetailsModal } from './components/OrderDetailsModal';

type RevenueGranularity = 'daily' | 'weekly' | 'monthly';
type DateRangePreset = 'all' | '7d' | '30d' | 'month' | 'custom';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStart(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export const Overview: React.FC = () => {
  const { settings, addToast } = useRestaurant();
  const { adminUser } = useAuth();
  useDocumentTitle('Overview | Unique Restaurant Admin');

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [granularity, setGranularity] = useState<RevenueGranularity>('daily');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.getOverviewStats();
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const currency = settings?.currency_symbol || '₦';

  const orders = stats?.orders || [];
  const foods = stats?.foods || [];
  const categories = stats?.categories || [];
  const enquiries = stats?.enquiries || [];

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => isPendingOrderStatus(o.status)).length,
    [orders]
  );

  // Date-filtered orders for Sales & Order Analytics
  const filteredAnalyticsOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const created = new Date(order.created_at);
      if (Number.isNaN(created.getTime())) return false;
      if (datePreset === '7d') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 6);
        cutoff.setHours(0, 0, 0, 0);
        return created >= cutoff;
      }
      if (datePreset === '30d') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 29);
        cutoff.setHours(0, 0, 0, 0);
        return created >= cutoff;
      }
      if (datePreset === 'month') {
        return (
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth()
        );
      }
      if (datePreset === 'custom') {
        if (customStart) {
          const s = new Date(`${customStart}T00:00:00`);
          if (created < s) return false;
        }
        if (customEnd) {
          const e = new Date(`${customEnd}T23:59:59`);
          if (created > e) return false;
        }
      }
      return true;
    });
  }, [orders, datePreset, customStart, customEnd]);

  // Comparison indicators based on real DB timestamps (Last 7 days vs Previous 7 days)
  const comparisons = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const recentStart = now - sevenDaysMs;
    const prevStart = now - 2 * sevenDaysMs;

    const currentOrders = orders.filter((o) => new Date(o.created_at).getTime() >= recentStart);
    const previousOrders = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= prevStart && t < recentStart;
    });

    const currentRev = currentOrders
      .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const prevRev = previousOrders
      .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const calcPct = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const recentFoodsAdded = foods.filter(
      (f) => now - new Date(f.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000
    ).length;

    const availabilityRate =
      foods.length > 0 ? Math.round(((stats?.availableMeals ?? 0) / foods.length) * 100) : 0;

    return {
      ordersDelta: calcPct(currentOrders.length, previousOrders.length),
      revenueDelta: calcPct(currentRev, prevRev),
      recentFoodsAdded,
      availabilityRate,
      unverifiedOrdersCount: orders.filter(
        (o) => o.payment_status === 'pending_payment' && o.status !== 'cancelled'
      ).length,
    };
  }, [orders, foods, stats?.availableMeals]);

  // Revenue Overview line chart series (strictly payment_status === 'paid' && status !== 'cancelled')
  const revenueSeries = useMemo(() => {
    const paidOrders = filteredAnalyticsOrders.filter(
      (o) => o.payment_status === 'paid' && o.status !== 'cancelled'
    );

    const buckets = new Map<string, { label: string; sortKey: number; value: number }>();

    if (granularity === 'daily') {
      const days = datePreset === '7d' ? 7 : 7;
      const now = startOfDay(new Date());
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = new Intl.DateTimeFormat('en-NG', {
          month: 'short',
          day: 'numeric',
        }).format(d);
        buckets.set(key, { label, sortKey: d.getTime(), value: 0 });
      }
      for (const o of paidOrders) {
        const d = startOfDay(new Date(o.payment_verified_at || o.created_at));
        const key = d.toISOString().slice(0, 10);
        const existing = buckets.get(key);
        if (existing) {
          existing.value += Number(o.total_amount || 0);
        } else {
          const label = new Intl.DateTimeFormat('en-NG', {
            month: 'short',
            day: 'numeric',
          }).format(d);
          buckets.set(key, {
            label,
            sortKey: d.getTime(),
            value: Number(o.total_amount || 0),
          });
        }
      }
    } else if (granularity === 'weekly') {
      const nowWeek = getWeekStart(new Date());
      for (let i = 3; i >= 0; i--) {
        const w = new Date(nowWeek);
        w.setDate(w.getDate() - i * 7);
        const key = w.toISOString().slice(0, 10);
        const label = `Wk ${new Intl.DateTimeFormat('en-NG', {
          month: 'short',
          day: 'numeric',
        }).format(w)}`;
        buckets.set(key, { label, sortKey: w.getTime(), value: 0 });
      }
      for (const o of paidOrders) {
        const w = getWeekStart(new Date(o.payment_verified_at || o.created_at));
        const key = w.toISOString().slice(0, 10);
        const existing = buckets.get(key);
        if (existing) {
          existing.value += Number(o.total_amount || 0);
        } else {
          buckets.set(key, {
            label: `Wk ${new Intl.DateTimeFormat('en-NG', {
              month: 'short',
              day: 'numeric',
            }).format(w)}`,
            sortKey: w.getTime(),
            value: Number(o.total_amount || 0),
          });
        }
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        const label = new Intl.DateTimeFormat('en-NG', {
          month: 'short',
          year: '2-digit',
        }).format(m);
        buckets.set(key, { label, sortKey: m.getTime(), value: 0 });
      }
      for (const o of paidOrders) {
        const d = new Date(o.payment_verified_at || o.created_at);
        const m = new Date(d.getFullYear(), d.getMonth(), 1);
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.value += Number(o.total_amount || 0);
        } else {
          buckets.set(key, {
            label: new Intl.DateTimeFormat('en-NG', {
              month: 'short',
              year: '2-digit',
            }).format(m),
            sortKey: m.getTime(),
            value: Number(o.total_amount || 0),
          });
        }
      }
    }

    return Array.from(buckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ label, value }) => ({ label, value }));
  }, [filteredAnalyticsOrders, granularity, datePreset]);

  const filteredVerifiedRevenue = useMemo(
    () =>
      filteredAnalyticsOrders
        .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [filteredAnalyticsOrders]
  );

  // Order Analytics Bar Counts
  const orderCounts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    for (const o of filteredAnalyticsOrders) {
      if (o.status === 'cancelled') cancelled += 1;
      else if (isCompletedOrderStatus(o.status)) completed += 1;
      else pending += 1;
    }
    return { completed, pending, cancelled };
  }, [filteredAnalyticsOrders]);

  // Food Categories Doughnut Data
  const categorySlices = useMemo(() => {
    const slices = categories.map((cat) => ({
      name: cat.name,
      count: foods.filter((f) => f.category_id === cat.id).length,
    }));
    const uncategorized = foods.filter((f) => !f.category_id).length;
    if (uncategorized > 0) {
      slices.push({ name: 'Uncategorized', count: uncategorized });
    }
    return slices;
  }, [categories, foods]);

  // Filtered Recent Orders & Recent Foods when search query is entered
  const q = searchQuery.trim().toLowerCase();

  const recentOrders = useMemo(() => {
    const base = q
      ? orders.filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.customer_phone.toLowerCase().includes(q) ||
            (o.order_items || []).some((i) => i.food_name.toLowerCase().includes(q))
        )
      : orders;
    return base.slice(0, 6);
  }, [orders, q]);

  const recentFoods = useMemo(() => {
    const base = q
      ? foods.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.category?.name || '').toLowerCase().includes(q)
        )
      : foods;
    return base.slice(0, 6);
  }, [foods, q]);

  // Popular Meals calculated from real order_items across non-cancelled orders
  const popularMeals = useMemo(() => {
    const foodById = new Map(foods.map((f) => [f.id, f]));
    const foodByName = new Map(foods.map((f) => [f.name.toLowerCase(), f]));
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        imageUrl: string;
        unitPrice: number;
        orderCount: number;
        totalQty: number;
        totalSales: number;
      }
    >();

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.order_items || []) {
        const matchedFood =
          (item.food_id && foodById.get(item.food_id)) ||
          foodByName.get(item.food_name.toLowerCase());
        const key = item.food_id || item.food_name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.orderCount += 1;
          existing.totalQty += item.quantity;
          existing.totalSales += Number(item.subtotal || 0);
        } else {
          map.set(key, {
            key,
            name: matchedFood?.name || item.food_name,
            imageUrl: matchedFood?.image_url || '',
            unitPrice: Number(matchedFood?.price ?? item.unit_price),
            orderCount: 1,
            totalQty: item.quantity,
            totalSales: Number(item.subtotal || 0),
          });
        }
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => b.totalQty - a.totalQty || b.totalSales - a.totalSales
    );
    return sorted.slice(0, 5);
  }, [orders, foods]);

  const topMealMaxQty = popularMeals[0]?.totalQty || 1;

  // Restaurant Activity Feed from real DB events
  const activityFeed = useMemo(() => {
    interface ActivityEntry {
      id: string;
      type: 'order' | 'payment' | 'enquiry' | 'food';
      title: string;
      subtitle: string;
      timestamp: string;
    }

    const items: ActivityEntry[] = [];

    for (const order of orders.slice(0, 8)) {
      items.push({
        id: `ord-${order.id}`,
        type: 'order',
        title: `New order from ${order.customer_name}`,
        subtitle: `#${order.id.slice(0, 8).toUpperCase()} · ${formatNaira(order.total_amount, currency)}`,
        timestamp: order.created_at,
      });

      if (order.payment_status === 'paid' && order.payment_verified_at) {
        items.push({
          id: `pay-${order.id}`,
          type: 'payment',
          title: `Payment verified for #${order.id.slice(0, 8).toUpperCase()}`,
          subtitle: `${formatNaira(order.total_amount, currency)} confirmed · ${order.customer_name}`,
          timestamp: order.payment_verified_at,
        });
      }
    }

    for (const enq of enquiries.slice(0, 6)) {
      items.push({
        id: `enq-${enq.id}`,
        type: 'enquiry',
        title: `Customer enquiry: ${enq.subject}`,
        subtitle: `From ${enq.name} (${enq.phone})`,
        timestamp: enq.created_at,
      });
    }

    for (const food of foods.slice(0, 5)) {
      items.push({
        id: `food-${food.id}`,
        type: 'food',
        title: `Menu item active: ${food.name}`,
        subtitle: `${food.category?.name || 'Uncategorized'} · ${formatNaira(food.price, currency)}`,
        timestamp: food.updated_at || food.created_at,
      });
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [orders, enquiries, foods, currency]);

  const handleOrderUpdate = async (
    orderId: string,
    payload: { status?: OrderStatus; payment_status?: PaymentStatus }
  ) => {
    setUpdatingOrder(true);
    try {
      const updated = await dataService.updateOrder(orderId, payload);
      setStats((prev) => {
        if (!prev) return prev;
        const nextOrders = prev.orders.map((o) => (o.id === orderId ? updated : o));
        const nextVerifiedRevenue = nextOrders
          .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        return {
          ...prev,
          orders: nextOrders,
          verifiedRevenue: nextVerifiedRevenue,
        };
      });
      setSelectedOrder(updated);
      addToast({ type: 'success', title: 'Order updated successfully' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not update order',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setUpdatingOrder(false);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <AdminLayout
      title="Overview"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search orders, meals, or customers..."
      pendingOrdersCount={pendingOrdersCount}
      unreadEnquiriesCount={stats?.unreadEnquiries ?? 0}
    >
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Dashboard Welcome Header */}
      <section className="mb-7 bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF3E8] text-[#E85D04] text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#252525] tracking-tight">
              Welcome Back, Admin
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Here&apos;s what&apos;s happening at Unique Restaurant today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Mobile quick search */}
            <div className="relative md:hidden">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders or meals..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E85D04]"
              />
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#FFF3E8]/70 border border-[#E85D04]/15">
              <div className="w-9 h-9 rounded-xl bg-[#E85D04] text-white flex items-center justify-center font-bold text-sm shrink-0">
                UR
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#252525] truncate">
                  {adminUser?.email || 'Unique Restaurant Admin'}
                </p>
                <p className="text-[11px] text-neutral-600">
                  {pendingOrdersCount} pending orders &middot; {stats?.unreadEnquiries ?? 0} unread enquiries
                </p>
              </div>
            </div>

            <Link
              to="/admin/foods?new=1"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-xl transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Meal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Summary Statistics (4 Cards) */}
      <section aria-label="Summary statistics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {/* Card 1: Total Food Items */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Food Items</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#252525] tabular-nums mt-1">
                {loading ? '—' : stats?.totalFoods ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
            <span className="text-neutral-500">
              Across {categories.length} menu categories
            </span>
            {comparisons.recentFoodsAdded > 0 && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-[#267A43] tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />+{comparisons.recentFoodsAdded} (30d)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Available Meals */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-500">Available Meals</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#267A43] tabular-nums mt-1">
                {loading ? '—' : stats?.availableMeals ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#267A43]/10 text-[#267A43] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
            <span className="text-neutral-500">
              {stats?.unavailableMeals ?? 0} currently unavailable
            </span>
            <span className="font-semibold text-[#267A43] tabular-nums">
              {comparisons.availabilityRate}% active
            </span>
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#252525] tabular-nums mt-1">
                {loading ? '—' : stats?.totalOrders ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
            <span className="text-neutral-500">{pendingOrdersCount} active in queue</span>
            {comparisons.ordersDelta !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                  comparisons.ordersDelta >= 0 ? 'text-[#267A43]' : 'text-red-600'
                }`}
              >
                {comparisons.ordersDelta >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {comparisons.ordersDelta >= 0 ? '+' : ''}
                {comparisons.ordersDelta}% (7d)
              </span>
            ) : (
              <span className="text-neutral-400">Live records</span>
            )}
          </div>
        </div>

        {/* Card 4: Verified Revenue */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500">Verified Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#252525] tabular-nums mt-1 truncate">
                {loading ? '—' : formatNaira(stats?.verifiedRevenue ?? 0, currency)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#267A43]/10 text-[#267A43] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
            <span className="text-neutral-500">
              {comparisons.unverifiedOrdersCount > 0
                ? `${comparisons.unverifiedOrdersCount} awaiting verification`
                : 'Verified paid orders only'}
            </span>
            {comparisons.revenueDelta !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                  comparisons.revenueDelta >= 0 ? 'text-[#267A43]' : 'text-red-600'
                }`}
              >
                {comparisons.revenueDelta >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {comparisons.revenueDelta >= 0 ? '+' : ''}
                {comparisons.revenueDelta}% (7d)
              </span>
            ) : (
              <span className="text-[#267A43] font-medium">Verified</span>
            )}
          </div>
        </div>
      </section>

      {/* 5. Sales & Order Analytics */}
      <section aria-label="Sales and Order Analytics" className="mb-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#252525]">Sales &amp; Order Analytics</h2>
            <p className="text-xs text-neutral-500">
              Real-time metrics computed directly from verified payments, order statuses, and menu items.
            </p>
          </div>

          {/* Functional Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'month', label: 'This Month' },
                { value: 'all', label: 'All Time' },
                { value: 'custom', label: 'Custom' },
              ] as { value: DateRangePreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDatePreset(preset.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  datePreset === preset.value
                    ? 'bg-[#E85D04] text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-[#252525] hover:bg-[#FFF3E8]'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  aria-label="Start date"
                  className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl"
                />
                <span className="text-xs text-neutral-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  aria-label="End date"
                  className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Revenue Overview Line Chart */}
          <div className="lg:col-span-6 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#252525]">Revenue Overview</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified earnings:{' '}
                  <span className="font-semibold text-[#267A43] tabular-nums">
                    {formatNaira(filteredVerifiedRevenue, currency)}
                  </span>
                </p>
              </div>
              <div className="inline-flex rounded-xl bg-[#F7F7F7] p-1 border border-neutral-200/70">
                {(['daily', 'weekly', 'monthly'] as RevenueGranularity[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      granularity === g
                        ? 'bg-white text-[#E85D04] shadow-xs'
                        : 'text-neutral-500 hover:text-[#252525]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
                Loading revenue chart...
              </div>
            ) : (
              <RevenueLineChart points={revenueSeries} currency={currency} />
            )}
          </div>

          {/* Order Analytics Bar Chart */}
          <div className="lg:col-span-3 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#252525]">Order Analytics</h3>
              <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                {filteredAnalyticsOrders.length} orders in range
              </p>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
                Loading order analytics...
              </div>
            ) : (
              <OrdersBarChart
                completed={orderCounts.completed}
                pending={orderCounts.pending}
                cancelled={orderCounts.cancelled}
              />
            )}
          </div>

          {/* Food Categories Doughnut Chart */}
          <div className="lg:col-span-3 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#252525]">Food Categories</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Distribution of {foods.length} menu meals
              </p>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-neutral-400">
                Loading categories...
              </div>
            ) : (
              <CategoryDoughnutChart slices={categorySlices} />
            )}
          </div>
        </div>
      </section>

      {/* 6. Recent Orders & 8. Popular Meals */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-7">
        {/* Recent Orders */}
        <section className="xl:col-span-8 bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200/80 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#252525]">Recent Orders</h2>
              <p className="text-xs text-neutral-500">
                Inspect customer orders, payment status, and fulfillment progress.
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E85D04] hover:underline whitespace-nowrap"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">Loading recent orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center mb-3">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#252525]">No orders recorded yet</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                {q
                  ? 'No orders matched your current search query.'
                  : 'Customer orders placed through the website menu will appear here automatically.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F7F7] border-b border-neutral-200/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Ordered Meals</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {recentOrders.map((order) => {
                      const itemsSummary =
                        order.order_items && order.order_items.length > 0
                          ? order.order_items
                              .map((i) => `${i.quantity}x ${i.food_name}`)
                              .join(', ')
                          : '—';
                      return (
                        <tr key={order.id} className="hover:bg-[#FFF3E8]/35 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#252525] tabular-nums whitespace-nowrap">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#252525] whitespace-nowrap">
                              {order.customer_name}
                            </p>
                            <p className="text-[11px] text-neutral-500 tabular-nums">
                              {order.customer_phone}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-700 max-w-[200px] truncate" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                            {formatDateTime(order.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#252525] whitespace-nowrap">
                            {formatNaira(order.total_amount, currency)}
                          </td>
                          <td className="py-3.5 px-4">
                            <PaymentStatusBadge paymentStatus={order.payment_status} />
                          </td>
                          <td className="py-3.5 px-4">
                            <OrderStatusBadge
                              status={order.status}
                              paymentStatus={order.payment_status}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-neutral-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#252525] tabular-nums">
                        #{order.id.slice(0, 8).toUpperCase()} &middot; {order.customer_name}
                      </span>
                      <span className="text-sm font-bold text-[#E85D04] tabular-nums">
                        {formatNaira(order.total_amount, currency)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-1">
                      {(order.order_items || [])
                        .map((i) => `${i.quantity}x ${i.food_name}`)
                        .join(', ') || 'No items listed'}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PaymentStatusBadge paymentStatus={order.payment_status} />
                        <OrderStatusBadge
                          status={order.status}
                          paymentStatus={order.payment_status}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-semibold text-[#E85D04] hover:underline cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 8. Popular Meals */}
        <section className="xl:col-span-4 bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200/80 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#252525]">Popular Meals</h2>
              <p className="text-xs text-neutral-500">Top ordered dishes from order records</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#E85D04]" />
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center">
            {loading ? (
              <p className="text-sm text-neutral-500 text-center">Calculating popular meals...</p>
            ) : popularMeals.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#252525]">No meal sales recorded yet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Once customers place orders, top-performing dishes and quantities will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {popularMeals.map((meal) => {
                  const pct = Math.max(8, Math.round((meal.totalQty / topMealMaxQty) * 100));
                  return (
                    <div key={meal.key} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                          <FoodImage
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#252525] truncate">
                            {meal.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 tabular-nums">
                            {formatNaira(meal.unitPrice, currency)} &middot; {meal.orderCount}{' '}
                            {meal.orderCount === 1 ? 'order' : 'orders'} ({meal.totalQty} qty)
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#252525] tabular-nums shrink-0">
                          {formatNaira(meal.totalSales, currency)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E85D04] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 7. Recent Food Items */}
      <section className="mb-7 bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#252525]">Recent Food Items</h2>
            <p className="text-xs text-neutral-500">
              Latest dishes on your menu with quick price, availability, and edit access.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/foods"
              className="text-xs font-semibold text-[#252525] hover:text-[#E85D04] transition-colors"
            >
              View All Foods
            </Link>
            <Link
              to="/admin/foods?new=1"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Meal</span>
            </Link>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading meals...</p>
          ) : recentFoods.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500">
              {q ? 'No food items match your search.' : 'No food items recorded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentFoods.map((food) => (
                <article
                  key={food.id}
                  className="rounded-xl border border-neutral-200/90 bg-[#F7F7F7]/50 hover:bg-white hover:border-[#E85D04]/40 transition-all overflow-hidden flex items-center gap-3.5 p-3"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    <FoodImage
                      src={food.image_url}
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#252525] truncate">
                        {food.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {food.category?.name || 'Uncategorized'}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#252525] tabular-nums">
                          {formatNaira(food.price, currency)}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            food.is_available
                              ? 'bg-[#267A43]/10 text-[#267A43]'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {food.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <Link
                        to={`/admin/foods?edit=${encodeURIComponent(food.id)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. Quick Actions & 10. Restaurant Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions (6 actions) */}
        <section className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#252525]">Quick Actions</h2>
            <p className="text-xs text-neutral-500">
              Jump directly to common restaurant management tasks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/admin/foods?new=1"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">Add New Meal</p>
                  <p className="text-[11px] text-neutral-500 truncate">Publish a dish to menu</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>

            <Link
              to="/admin/categories"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">Manage Food Categories</p>
                  <p className="text-[11px] text-neutral-500 truncate">Organize menu sections</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>

            <Link
              to="/admin/orders"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#267A43]/10 text-[#267A43] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">View Orders</p>
                  <p className="text-[11px] text-neutral-500 truncate">Verify &amp; update orders</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>

            <Link
              to="/admin/enquiries"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">Manage Customer Enquiries</p>
                  <p className="text-[11px] text-neutral-500 truncate">Read &amp; respond to messages</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>

            <Link
              to="/admin/content"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] text-[#252525] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">Edit Website Content</p>
                  <p className="text-[11px] text-neutral-500 truncate">Update hero &amp; story text</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>

            <Link
              to="/admin/settings"
              className="group p-4 rounded-xl border border-neutral-200 hover:border-[#E85D04] hover:bg-[#FFF3E8]/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] text-[#252525] flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#252525]">Restaurant Settings</p>
                  <p className="text-[11px] text-neutral-500 truncate">Hours, contact &amp; fees</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E85D04] shrink-0" />
            </Link>
          </div>
        </section>

        {/* 10. Restaurant Activity */}
        <section className="lg:col-span-5 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#252525]">Restaurant Activity</h2>
              <p className="text-xs text-neutral-500">Latest orders, payments, enquiries &amp; updates</p>
            </div>
            <Activity className="w-4 h-4 text-[#E85D04]" />
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500 py-6 text-center">Loading activity...</p>
          ) : activityFeed.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No recent restaurant activity logged yet.
            </div>
          ) : (
            <ul className="space-y-3.5">
              {activityFeed.map((entry) => {
                const iconEl =
                  entry.type === 'payment' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#267A43]" />
                  ) : entry.type === 'order' ? (
                    <ShoppingBag className="w-4 h-4 text-[#E85D04]" />
                  ) : entry.type === 'enquiry' ? (
                    <MessageSquare className="w-4 h-4 text-[#E85D04]" />
                  ) : (
                    <Utensils className="w-4 h-4 text-[#252525]" />
                  );

                const bgEl =
                  entry.type === 'payment'
                    ? 'bg-[#267A43]/10'
                    : entry.type === 'food'
                    ? 'bg-[#F7F7F7]'
                    : 'bg-[#FFF3E8]';

                return (
                  <li key={entry.id} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl ${bgEl} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {iconEl}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#252525] truncate">{entry.title}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{entry.subtitle}</p>
                    </div>
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        currency={currency}
        updating={updatingOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateOrder={handleOrderUpdate}
      />
    </AdminLayout>
  );
};
