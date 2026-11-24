import React from 'react';
import type { OrderStatus, PaymentStatus } from '../../types';

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

export function getOrderStatusMeta(
  status: OrderStatus,
  paymentStatus?: PaymentStatus
): { label: string; badgeClass: string; dotClass: string } {
  switch (status) {
    case 'delivered':
    case 'completed':
      return {
        label: 'Delivered',
        badgeClass: 'bg-[#267A43]/10 text-[#267A43] border-[#267A43]/25',
        dotClass: 'bg-[#267A43]',
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        badgeClass: 'bg-[#FFF3E8] text-[#E85D04] border-[#E85D04]/30',
        dotClass: 'bg-[#E85D04]',
      };
    case 'ready_for_pickup':
      return {
        label: 'Ready for Pickup',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'preparing':
    case 'processing':
      return {
        label: 'Preparing',
        badgeClass: 'bg-[#FFF3E8] text-[#C84B00] border-[#E85D04]/25',
        dotClass: 'bg-[#E85D04]',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotClass: 'bg-red-600',
      };
    case 'pending':
    default:
      if (paymentStatus === 'paid') {
        return {
          label: 'Paid',
          badgeClass: 'bg-[#267A43]/10 text-[#267A43] border-[#267A43]/25',
          dotClass: 'bg-[#267A43]',
        };
      }
      return {
        label: 'Pending Payment',
        badgeClass: 'bg-neutral-100 text-[#252525] border-neutral-200',
        dotClass: 'bg-neutral-500',
      };
  }
}

export function getPaymentStatusMeta(paymentStatus: PaymentStatus): {
  label: string;
  badgeClass: string;
} {
  switch (paymentStatus) {
    case 'paid':
      return {
        label: 'Paid',
        badgeClass: 'bg-[#267A43]/10 text-[#267A43] border-[#267A43]/25',
      };
    case 'refunded':
      return {
        label: 'Refunded',
        badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      };
    case 'pending_payment':
    default:
      return {
        label: 'Pending Payment',
        badgeClass: 'bg-[#FFF3E8] text-[#E85D04] border-[#E85D04]/25',
      };
  }
}

export const OrderStatusBadge: React.FC<{
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
}> = ({ status, paymentStatus }) => {
  const meta = getOrderStatusMeta(status, paymentStatus);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ paymentStatus: PaymentStatus }> = ({
  paymentStatus,
}) => {
  const meta = getPaymentStatusMeta(paymentStatus);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
};

export function isCompletedOrderStatus(status: OrderStatus): boolean {
  return status === 'completed' || status === 'delivered';
}

export function isPendingOrderStatus(status: OrderStatus): boolean {
  return (
    status === 'pending' ||
    status === 'processing' ||
    status === 'preparing' ||
    status === 'ready_for_pickup' ||
    status === 'out_for_delivery'
  );
}
