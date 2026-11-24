import { DeliveryType } from '../types';

export function formatNaira(amount: number, symbol = '₦'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  return digits || '2349067566746';
}

export function sanitizeImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed;
  }
  return '';
}

export function sanitizeExternalLink(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return '';
}

export interface WhatsAppOrderPayload {
  restaurantName: string;
  whatsappNumber: string;
  currencySymbol: string;
  customerName: string;
  customerPhone: string;
  foodName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  preferredTime?: string;
  additionalInstructions?: string;
}

export function buildWhatsAppOrderUrl(payload: WhatsAppOrderPayload): string {
  const cleanPhone = normalizeWhatsAppNumber(payload.whatsappNumber);
  const lines = [
    `Hello ${payload.restaurantName}, I would like to place an order:`,
    '',
    `*Customer Details*`,
    `Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    '',
    `*Order Summary*`,
    `Meal: ${payload.foodName}`,
    `Quantity: ${payload.quantity}`,
    `Unit Price: ${formatNaira(payload.unitPrice, payload.currencySymbol)}`,
    `Subtotal: ${formatNaira(payload.subtotal, payload.currencySymbol)}`,
    `Fulfillment: ${payload.deliveryType === 'delivery' ? 'Delivery' : 'Self Pickup'}`,
    ...(payload.deliveryType === 'delivery'
      ? [
          `Delivery Fee: ${formatNaira(payload.deliveryFee, payload.currencySymbol)}`,
          `Delivery Address: ${payload.deliveryAddress || 'Not provided'}`,
        ]
      : []),
    `*Total Amount: ${formatNaira(payload.totalAmount, payload.currencySymbol)}*`,
    ...(payload.preferredTime ? [`Preferred Time: ${payload.preferredTime}`] : []),
    ...(payload.additionalInstructions
      ? [`Additional Instructions: ${payload.additionalInstructions}`]
      : []),
    '',
    `Please confirm availability and preparation time. Thank you!`,
  ];

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
