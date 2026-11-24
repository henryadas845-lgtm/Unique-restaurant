import React from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Truck,
  X,
} from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatDateTime, formatNaira, normalizeWhatsAppNumber } from '../../utils/format';
import {
  ORDER_STATUS_OPTIONS,
  OrderStatusBadge,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusBadge,
} from './OrderBadges';

interface OrderDetailsModalProps {
  order: Order | null;
  currency: string;
  updating?: boolean;
  onClose: () => void;
  onUpdateOrder: (
    orderId: string,
    payload: { status?: OrderStatus; payment_status?: PaymentStatus }
  ) => Promise<void>;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  currency,
  updating = false,
  onClose,
  onUpdateOrder,
}) => {
  if (!order) return null;

  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const normalizedCustomerPhone = normalizeWhatsAppNumber(order.customer_phone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
    >
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-admin">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF3E8] border-b border-[#E85D04]/15 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 id="order-details-title" className="text-lg font-bold text-[#252525] tabular-nums">
                Order {shortId}
              </h2>
              <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
              <PaymentStatusBadge paymentStatus={order.payment_status} />
            </div>
            <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E85D04]" />
              <span>Placed {formatDateTime(order.created_at)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="p-2 rounded-lg text-neutral-500 hover:text-[#252525] hover:bg-white/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F7F7F7] border border-neutral-200/80 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Customer Details
              </p>
              <p className="text-sm font-semibold text-[#252525]">{order.customer_name}</p>
              <p className="text-xs text-neutral-600 tabular-nums flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#E85D04]" />
                <span>{order.customer_phone}</span>
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href={`tel:${order.customer_phone}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg text-[#252525] hover:border-[#E85D04] transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${normalizedCustomerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#267A43]/10 border border-[#267A43]/25 rounded-lg text-[#267A43] hover:bg-[#267A43]/15 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F7F7] border border-neutral-200/80 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Fulfillment Info
              </p>
              <p className="text-sm font-semibold text-[#252525] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#E85D04]" />
                <span>{order.delivery_type === 'delivery' ? 'Home Delivery' : 'Self Pickup'}</span>
              </p>
              {order.delivery_address && (
                <p className="text-xs text-neutral-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </p>
              )}
              {order.preferred_delivery_time && (
                <p className="text-xs text-neutral-600">
                  Preferred time: <span className="font-medium">{order.preferred_delivery_time}</span>
                </p>
              )}
              {order.additional_instructions && (
                <p className="text-xs text-[#E85D04] bg-[#FFF3E8] px-2.5 py-1.5 rounded-lg">
                  Note: {order.additional_instructions}
                </p>
              )}
            </div>
          </div>

          {/* Ordered Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-[#E85D04]" />
              <h3 className="text-sm font-semibold text-[#252525]">Ordered Meals</h3>
            </div>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7F7F7] border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                    <th className="py-2.5 px-4">Meal</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 font-medium text-[#252525]">{item.food_name}</td>
                        <td className="py-3 px-4 text-center tabular-nums text-neutral-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-neutral-600">
                          {formatNaira(item.unit_price, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#252525]">
                          {formatNaira(item.subtotal, currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-center text-xs text-neutral-500">
                        No itemized meals recorded for this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="bg-[#F7F7F7] px-4 py-3 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Meals Subtotal</span>
                  <span className="tabular-nums font-medium">
                    {formatNaira(order.subtotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums font-medium">
                    {formatNaira(order.delivery_fee, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#252525] pt-1.5 border-t border-neutral-200">
                  <span>Total Amount</span>
                  <span className="tabular-nums text-[#E85D04]">
                    {formatNaira(order.total_amount, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Status Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Payment Verification
              </label>
              <select
                value={order.payment_status}
                disabled={updating}
                onChange={(e) =>
                  void onUpdateOrder(order.id, {
                    payment_status: e.target.value as PaymentStatus,
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {order.payment_status !== 'paid' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => void onUpdateOrder(order.id, { payment_status: 'paid' })}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#267A43] hover:bg-[#1f6537] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Payment as Paid</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Order Progress Status
              </label>
              <select
                value={order.status === 'processing' ? 'preparing' : order.status === 'completed' ? 'delivered' : order.status}
                disabled={updating}
                onChange={(e) =>
                  void onUpdateOrder(order.id, {
                    status: e.target.value as OrderStatus,
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              >
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-white flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-[#252525] bg-[#F7F7F7] hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
