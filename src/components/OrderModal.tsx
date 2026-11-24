import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ExternalLink, Minus, Plus, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { dataService } from '../lib/api';
import type { DeliveryType } from '../types';
import { buildWhatsAppOrderUrl, formatNaira } from '../utils/format';
import { FoodImage } from './FoodImage';

const orderFormSchema = z
  .object({
    customer_name: z.string().trim().min(2, 'Please enter your full name'),
    customer_phone: z
      .string()
      .trim()
      .min(7, 'Please enter a valid WhatsApp phone number'),
    delivery_type: z.enum(['delivery', 'pickup']),
    delivery_address: z.string().trim().optional(),
    preferred_delivery_time: z.string().trim().optional(),
    additional_instructions: z.string().trim().optional(),
  })
  .refine(
    (vals) =>
      vals.delivery_type === 'pickup' ||
      (vals.delivery_address && vals.delivery_address.trim().length >= 4),
    {
      message: 'Please provide your delivery address in Osogbo / surrounding area',
      path: ['delivery_address'],
    }
  );

type OrderFormValues = z.infer<typeof orderFormSchema>;

export const OrderModal: React.FC = () => {
  const { selectedFoodForOrder, closeOrderModal, settings, foods, addToast } = useRestaurant();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      delivery_type: 'delivery',
      delivery_address: '',
      preferred_delivery_time: '',
      additional_instructions: '',
    },
  });

  const deliveryType = watch('delivery_type');

  useEffect(() => {
    if (selectedFoodForOrder) {
      setQuantity(1);
      setWhatsappUrl(null);
      reset({
        customer_name: '',
        customer_phone: '',
        delivery_type: 'delivery',
        delivery_address: '',
        preferred_delivery_time: '',
        additional_instructions: '',
      });
    }
  }, [selectedFoodForOrder, reset]);

  if (!selectedFoodForOrder || !settings) return null;

  const currency = settings.currency_symbol || '₦';
  const unitPrice = Number(selectedFoodForOrder.price);
  const subtotal = unitPrice * quantity;
  const deliveryFee = deliveryType === 'delivery' ? Number(settings.delivery_fee || 0) : 0;
  const totalAmount = subtotal + deliveryFee;

  const onSubmit = async (values: OrderFormValues) => {
    setSubmitting(true);
    try {
      await dataService.submitOrderRequest(
        {
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          delivery_type: values.delivery_type,
          delivery_address: values.delivery_address,
          preferred_delivery_time: values.preferred_delivery_time,
          additional_instructions: values.additional_instructions,
          items: [{ food_id: selectedFoodForOrder.id, quantity }],
        },
        foods,
        settings
      );

      const url = buildWhatsAppOrderUrl({
        restaurantName: settings.restaurant_name,
        whatsappNumber: settings.whatsapp_number,
        currencySymbol: currency,
        customerName: values.customer_name,
        customerPhone: values.customer_phone,
        foodName: selectedFoodForOrder.name,
        quantity,
        unitPrice,
        subtotal,
        deliveryFee,
        totalAmount,
        deliveryType: values.delivery_type,
        deliveryAddress: values.delivery_address,
        preferredTime: values.preferred_delivery_time,
        additionalInstructions: values.additional_instructions,
      });

      setWhatsappUrl(url);
      addToast({
        type: 'info',
        title: 'WhatsApp message prepared',
        description: 'Send the pre-filled WhatsApp message to complete your order request.',
      });

      // Open WhatsApp conversation directly in a new tab/window
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not prepare order',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const setFulfillment = (type: DeliveryType) => {
    setValue('delivery_type', type, { shouldValidate: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#EA580C]">Order Request</p>
            <h2 id="order-modal-title" className="font-display text-xl font-bold text-[#111111]">
              {whatsappUrl ? 'Send Your WhatsApp Order' : selectedFoodForOrder.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeOrderModal}
            aria-label="Close order modal"
            className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {whatsappUrl ? (
            <div className="space-y-5">
              <div className="p-5 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-[#111111] mb-1">
                    One Last Step: Send the WhatsApp Message
                  </h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    Your order request for{' '}
                    <span className="font-semibold">
                      {quantity} &times; {selectedFoodForOrder.name}
                    </span>{' '}
                    ({formatNaira(totalAmount, currency)}) has been prepared. Your order is{' '}
                    <span className="font-semibold">not confirmed yet</span> until you send the
                    pre-filled message in WhatsApp and our kitchen replies.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors"
                >
                  <span>Open WhatsApp to Send</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={closeOrderModal}
                  className="py-3 px-5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Selected Meal Summary Bar */}
              <div className="flex items-center gap-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                  <FoodImage
                    src={selectedFoodForOrder.image_url}
                    alt={selectedFoodForOrder.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#111111] truncate">
                    {selectedFoodForOrder.name}
                  </h3>
                  <p className="text-sm font-bold text-[#C81E1E] tabular-nums mt-0.5">
                    {formatNaira(unitPrice, currency)} each
                  </p>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    className="w-10 h-10 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delivery vs Pickup Selector */}
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-2">
                  Delivery or Self Pickup
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFulfillment('delivery')}
                    className={`py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
                      deliveryType === 'delivery'
                        ? 'bg-white text-[#111111] shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Delivery ({formatNaira(settings.delivery_fee || 0, currency)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment('pickup')}
                    className={`py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
                      deliveryType === 'pickup'
                        ? 'bg-white text-[#111111] shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Self Pickup (Free)
                  </button>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order_name" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Full Name <span className="text-[#C81E1E]">*</span>
                  </label>
                  <input
                    id="order_name"
                    type="text"
                    placeholder="e.g. Adebayo Tunde"
                    {...register('customer_name')}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-xs text-[#C81E1E]">{errors.customer_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="order_phone" className="block text-sm font-medium text-[#111111] mb-1.5">
                    WhatsApp Phone Number <span className="text-[#C81E1E]">*</span>
                  </label>
                  <input
                    id="order_phone"
                    type="tel"
                    placeholder="e.g. 0803 123 4567"
                    {...register('customer_phone')}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                  />
                  {errors.customer_phone && (
                    <p className="mt-1 text-xs text-[#C81E1E]">{errors.customer_phone.message}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address (required only for delivery) */}
              {deliveryType === 'delivery' && (
                <div>
                  <label htmlFor="order_address" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Delivery Location / Address <span className="text-[#C81E1E]">*</span>
                  </label>
                  <input
                    id="order_address"
                    type="text"
                    placeholder="Enter your street, landmark, or area in Osogbo"
                    {...register('delivery_address')}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                  />
                  {errors.delivery_address && (
                    <p className="mt-1 text-xs text-[#C81E1E]">{errors.delivery_address.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order_time" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Preferred Delivery / Pickup Time (Optional)
                  </label>
                  <input
                    id="order_time"
                    type="text"
                    placeholder="e.g. 1:30 PM or As soon as possible"
                    {...register('preferred_delivery_time')}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                  />
                </div>
                <div>
                  <label htmlFor="order_notes" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Additional Instructions (Optional)
                  </label>
                  <input
                    id="order_notes"
                    type="text"
                    placeholder="e.g. Extra pepper, pack separately"
                    {...register('additional_instructions')}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                  />
                </div>
              </div>

              {/* Itemized Order Summary */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>
                    {selectedFoodForOrder.name} &times; {quantity}
                  </span>
                  <span className="tabular-nums font-medium text-[#111111]">
                    {formatNaira(subtotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>{deliveryType === 'delivery' ? 'Delivery Fee' : 'Self Pickup'}</span>
                  <span className="tabular-nums font-medium text-[#111111]">
                    {deliveryType === 'delivery' ? formatNaira(deliveryFee, currency) : 'Free'}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-base font-bold text-[#111111]">
                  <span>Total Amount</span>
                  <span className="tabular-nums text-[#C81E1E]">
                    {formatNaira(totalAmount, currency)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Preparing Order...' : 'Place Order via WhatsApp'}
              </button>

              <p className="text-xs text-neutral-500 text-center">
                No online payment is charged here. You will be redirected to WhatsApp to send your order request directly to our team.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
