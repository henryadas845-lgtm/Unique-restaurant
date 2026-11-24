import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import { normalizeWhatsAppNumber } from '../utils/format';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().min(7, 'Please enter a valid phone number'),
  subject: z.string().trim().min(2, 'Please enter a subject'),
  message: z.string().trim().min(5, 'Please write a short message (at least 5 characters)'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const Contact: React.FC = () => {
  const { settings, addToast } = useRestaurant();
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useDocumentTitle(
    'Contact Us | Unique Restaurant Osogbo',
    'Reach Unique Restaurant in Owo Ede, Osogbo, Osun State for enquiries, food orders, and catering requests.'
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' },
  });

  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';
  const location = settings?.location || 'Owo Ede, Osogbo, Osun State, Nigeria';
  const phone = settings?.phone_number || '+234 906 756 6746';
  const whatsappClean = normalizeWhatsAppNumber(settings?.whatsapp_number || '2349067566746');
  const openingHours = settings?.opening_hours || 'Opening hours editable via Admin Dashboard';

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    setSubmittedSuccess(false);
    try {
      await dataService.submitEnquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: values.subject,
        message: values.message,
      });
      setSubmittedSuccess(true);
      reset();
      addToast({
        type: 'success',
        title: 'Message sent',
        description: 'Thank you for reaching out. Our team will review your enquiry shortly.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to send message',
        description: err instanceof Error ? err.message : 'Please try again or chat on WhatsApp.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const mapsQuery = encodeURIComponent(location);
  const mapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <PublicLayout>
      {/* Contact Hero */}
      <section className="bg-[#111111] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#EA580C] mb-3">We Are Here To Serve You</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Get In Touch With Us
            </h1>
            <p className="text-base sm:text-lg text-neutral-300">
              We would love to hear from you. Reach out to us for enquiries, food orders, and other information.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Contact Information Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-neutral-200 rounded-2xl p-7 bg-[#F9F8F6]">
                <h2 className="font-display text-2xl font-bold text-[#111111] mb-6">
                  {restaurantName}
                </h2>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111] mb-0.5">Location</p>
                      <p className="text-neutral-600">{location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <MessageCircle className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111] mb-0.5">WhatsApp</p>
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-700 hover:text-[#C81E1E] font-medium"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <Phone className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111] mb-0.5">Phone</p>
                      <a
                        href={`tel:${phone.replace(/\s+/g, '')}`}
                        className="text-neutral-700 hover:text-[#C81E1E] font-medium"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <Clock className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111] mb-0.5">Opening Hours</p>
                      <p className="text-neutral-600">{openingHours}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <a
                    href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                      `Hello ${restaurantName}, I would like to make an enquiry.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat With Us on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form Column */}
            <div className="lg:col-span-7">
              <div className="border border-neutral-200 rounded-2xl p-7 sm:p-8 bg-white">
                <h2 className="font-display text-2xl font-bold text-[#111111] mb-2">
                  Send Us a Message
                </h2>
                <p className="text-sm text-neutral-600 mb-6">
                  Have a question about our meals, bulk orders, or availability? Fill in the form below.
                </p>

                {submittedSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-900">
                      <p className="font-semibold">Enquiry received!</p>
                      <p className="text-emerald-800 mt-0.5">
                        Thank you for contacting {restaurantName}. We will respond to you soon.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact_name" className="block text-sm font-medium text-[#111111] mb-1.5">
                        Full Name <span className="text-[#C81E1E]">*</span>
                      </label>
                      <input
                        id="contact_name"
                        type="text"
                        placeholder="Your full name"
                        {...register('name')}
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-[#C81E1E]">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact_phone" className="block text-sm font-medium text-[#111111] mb-1.5">
                        Phone Number <span className="text-[#C81E1E]">*</span>
                      </label>
                      <input
                        id="contact_phone"
                        type="tel"
                        placeholder="e.g. 0803 123 4567"
                        {...register('phone')}
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-[#C81E1E]">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact_email" className="block text-sm font-medium text-[#111111] mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        id="contact_email"
                        type="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-[#C81E1E]">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact_subject" className="block text-sm font-medium text-[#111111] mb-1.5">
                        Subject <span className="text-[#C81E1E]">*</span>
                      </label>
                      <input
                        id="contact_subject"
                        type="text"
                        placeholder="e.g. Event catering or meal enquiry"
                        {...register('subject')}
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-xs text-[#C81E1E]">{errors.subject.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact_message" className="block text-sm font-medium text-[#111111] mb-1.5">
                      Message <span className="text-[#C81E1E]">*</span>
                    </label>
                    <textarea
                      id="contact_message"
                      rows={5}
                      placeholder="Write your message here..."
                      {...register('message')}
                      className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-[#C81E1E]">{errors.message.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <section className="py-16 bg-[#F9F8F6] border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] mb-1">
                Find Us in Osogbo
              </h2>
              <p className="text-sm text-neutral-600">{location}</p>
            </div>
            <a
              href={mapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C81E1E] hover:text-[#991B1B] whitespace-nowrap"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white h-80 sm:h-96">
            <iframe
              title="Unique Restaurant Location — Owo Ede, Osogbo, Osun State"
              src={mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
