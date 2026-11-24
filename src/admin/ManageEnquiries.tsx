import React, { useEffect, useMemo, useState } from 'react';
import { Check, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dataService } from '../lib/api';
import type { Enquiry } from '../types';
import { formatDateTime, normalizeWhatsAppNumber } from '../utils/format';
import { AdminLayout } from './AdminLayout';

export const ManageEnquiries: React.FC = () => {
  const { addToast } = useRestaurant();
  useDocumentTitle('Customer Enquiries | Unique Restaurant Admin');

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const list = await dataService.fetchEnquiries();
      setEnquiries(list);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load enquiries',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEnquiries();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (filterMode === 'unread' && e.is_read) return false;
      if (filterMode === 'read' && !e.is_read) return false;
      if (q) {
        const match =
          e.name.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [enquiries, search, filterMode]);

  const unreadCount = useMemo(
    () => enquiries.filter((e) => !e.is_read).length,
    [enquiries]
  );

  const handleToggleRead = async (enq: Enquiry) => {
    try {
      const updated = await dataService.toggleEnquiryRead(enq.id, !enq.is_read);
      setEnquiries((prev) => prev.map((e) => (e.id === enq.id ? updated : e)));
      addToast({
        type: 'success',
        title: updated.is_read ? 'Marked as read' : 'Marked as unread',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteEnquiry(deleteTarget.id);
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      addToast({ type: 'success', title: 'Enquiry deleted' });
      setDeleteTarget(null);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not delete enquiry',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <AdminLayout
      title="Customer Enquiries"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search customer enquiries..."
      unreadEnquiriesCount={unreadCount}
    >
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, subject, message..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F7F7] border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E85D04]"
            />
          </div>

          <div className="inline-flex rounded-xl bg-[#F7F7F7] p-1 border border-neutral-200/70 self-start">
            {(
              [
                { value: 'all', label: `All (${enquiries.length})` },
                { value: 'unread', label: `Unread (${unreadCount})` },
                { value: 'read', label: `Read (${enquiries.length - unreadCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterMode(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterMode === tab.value
                    ? 'bg-white text-[#E85D04] shadow-xs'
                    : 'text-neutral-600 hover:text-[#252525]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadEnquiries()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#252525] bg-[#F7F7F7] border border-neutral-200 hover:bg-[#FFF3E8] hover:text-[#E85D04] rounded-xl cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-10 text-center text-sm text-neutral-500 shadow-xs">
          Loading customer enquiries...
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-12 text-center text-sm text-neutral-500 shadow-xs">
          {enquiries.length === 0
            ? 'No customer enquiries have been received yet.'
            : 'No enquiries match your current filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((enq) => (
            <article
              key={enq.id}
              className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs transition-colors ${
                enq.is_read
                  ? 'border-neutral-200/90'
                  : 'border-[#E85D04]/40 bg-[#FFF3E8]/35'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2.5 text-xs mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        enq.is_read
                          ? 'bg-[#F7F7F7] text-neutral-500'
                          : 'bg-[#E85D04] text-white'
                      }`}
                    >
                      {enq.is_read ? 'Read' : 'New Enquiry'}
                    </span>
                    <span aria-hidden="true" className="text-neutral-300">
                      &middot;
                    </span>
                    <span className="text-neutral-500">{formatDateTime(enq.created_at)}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#252525]">{enq.subject}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleToggleRead(enq)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F7F7F7] hover:bg-[#FFF3E8] text-[#252525] hover:text-[#E85D04] rounded-xl cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{enq.is_read ? 'Mark Unread' : 'Mark as Read'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(enq)}
                    aria-label="Delete enquiry"
                    className="p-2 rounded-xl text-neutral-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-neutral-700 leading-relaxed mb-4 whitespace-pre-line">
                {enq.message}
              </p>

              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-semibold text-[#252525]">{enq.name}</span>
                  <a
                    href={`tel:${enq.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-[#E85D04]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#E85D04]" />
                    <span className="tabular-nums">{enq.phone}</span>
                  </a>
                  {enq.email && (
                    <a
                      href={`mailto:${enq.email}?subject=${encodeURIComponent(`Re: ${enq.subject}`)}`}
                      className="inline-flex items-center gap-1.5 hover:text-[#E85D04]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#E85D04]" />
                      <span>{enq.email}</span>
                    </a>
                  )}
                </div>

                <a
                  href={`https://wa.me/${normalizeWhatsAppNumber(enq.phone)}?text=${encodeURIComponent(
                    `Hello ${enq.name}, thank you for contacting Unique Restaurant regarding "${enq.subject}".`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#267A43]/10 text-[#267A43] font-semibold hover:bg-[#267A43]/15 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Reply on WhatsApp</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-sm p-6 font-admin">
            <h2 className="text-lg font-bold text-[#252525] mb-2">
              Delete this enquiry?
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              This will permanently remove the message from {deleteTarget.name}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-[#F7F7F7] hover:bg-neutral-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
