import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Eye, RefreshCw, Search } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import type { Order, OrderStatus, PaymentStatus } from '../types';
import { formatDateTime, formatNaira } from '../utils/format';
import { AdminLayout } from './AdminLayout';
import {
  ORDER_STATUS_OPTIONS,
  OrderStatusBadge,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusBadge,
  isCompletedOrderStatus,
  isPendingOrderStatus,
} from './components/OrderBadges';
import { OrderDetailsModal } from './components/OrderDetailsModal';

type FilterTab = 'all' | 'pending' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';

const STATUS_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending Payment' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ManageOrders: React.FC = () => {
  const { settings, addToast } = useRestaurant();
  useDocumentTitle('Orders | Unique Restaurant Admin');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterTab>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const currency = settings?.currency_symbol || '₦';

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await dataService.fetchOrders();
      setOrders(list);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load orders',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterStatus !== 'all') {
        if (filterStatus === 'preparing') {
          if (o.status !== 'preparing' && o.status !== 'processing') return false;
        } else if (filterStatus === 'delivered') {
          if (!isCompletedOrderStatus(o.status)) return false;
        } else if (o.status !== filterStatus) {
          return false;
        }
      }
      if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false;
      if (q) {
        const match =
          o.id.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q) ||
          (o.order_items || []).some((i) => i.food_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [orders, filterStatus, paymentFilter, search]);

  const handleOrderUpdate = async (
    orderId: string,
    payload: { status?: OrderStatus; payment_status?: PaymentStatus }
  ) => {
    setUpdatingId(orderId);
    try {
      const updated = await dataService.updateOrder(orderId, payload);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      addToast({ type: 'success', title: 'Order updated' });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Order update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = useMemo(
    () => orders.filter((o) => isPendingOrderStatus(o.status)).length,
    [orders]
  );

  return (
    <AdminLayout
      title="Orders"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by Order ID, customer, or meal..."
      pendingOrdersCount={pendingCount}
    >
      <div className="mb-6 p-4 sm:p-5 bg-[#FFF3E8] border border-[#E85D04]/25 rounded-2xl text-sm text-[#252525]">
        <p className="font-semibold text-[#E85D04] mb-1">
          WhatsApp Order Requests &amp; Payment Verification
        </p>
        <p className="text-xs text-neutral-700 leading-relaxed">
          Orders are logged when customers click &ldquo;Place Order via WhatsApp&rdquo;. Only orders marked as <strong>Paid</strong> count toward your Verified Revenue on the dashboard.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, order ID..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E85D04]"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
              aria-label="Filter by payment status"
              className="px-3.5 py-2 text-sm bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E85D04]"
            >
              <option value="all">All Payment Statuses</option>
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#252525] bg-[#F7F7F7] border border-neutral-200 hover:bg-[#FFF3E8] hover:text-[#E85D04] rounded-xl self-start cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                filterStatus === tab.value
                  ? 'bg-[#E85D04] text-white shadow-xs'
                  : 'bg-[#F7F7F7] text-[#252525] hover:bg-[#FFF3E8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Loading order requests...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-14 px-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#252525]">No orders match this view</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try switching status filters or clearing your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-[#F7F7F7] text-xs font-semibold text-neutral-600">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Ordered Meals</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF3E8]/35 align-top transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-xs text-[#252525] tabular-nums whitespace-nowrap">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#252525]">{order.customer_name}</p>
                      <p className="text-xs text-neutral-500 tabular-nums">{order.customer_phone}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Self Pickup'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.order_items && order.order_items.length > 0 ? (
                        <ul className="space-y-1 text-xs text-neutral-700">
                          {order.order_items.map((item) => (
                            <li key={item.id}>
                              <span className="font-semibold tabular-nums">{item.quantity}&times;</span>{' '}
                              {item.food_name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[#252525] whitespace-nowrap">
                      {formatNaira(order.total_amount, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.payment_status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          void handleOrderUpdate(order.id, {
                            payment_status: e.target.value as PaymentStatus,
                          })
                        }
                        aria-label={`Payment status for ${order.customer_name}`}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E85D04] cursor-pointer"
                      >
                        {PAYMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5">
                        <PaymentStatusBadge paymentStatus={order.payment_status} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={
                          order.status === 'processing'
                            ? 'preparing'
                            : order.status === 'completed'
                            ? 'delivered'
                            : order.status
                        }
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          void handleOrderUpdate(order.id, {
                            status: e.target.value as OrderStatus,
                          })
                        }
                        aria-label={`Order status for ${order.customer_name}`}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E85D04] cursor-pointer"
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5">
                        <OrderStatusBadge
                          status={order.status}
                          paymentStatus={order.payment_status}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-500 whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#E85D04] bg-[#FFF3E8] hover:bg-[#E85D04] hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        currency={currency}
        updating={Boolean(selectedOrder && updatingId === selectedOrder.id)}
        onClose={() => setSelectedOrder(null)}
        onUpdateOrder={handleOrderUpdate}
      />
    </AdminLayout>
  );
};
