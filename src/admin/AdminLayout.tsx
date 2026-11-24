import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { dataService } from '../lib/api';

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  pendingOrdersCount?: number;
  unreadEnquiriesCount?: number;
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/foods', label: 'Manage Foods', icon: Utensils },
  { to: '/admin/categories', label: 'Food Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/enquiries', label: 'Customer Enquiries', icon: MessageSquare },
  { to: '/admin/content', label: 'Website Content', icon: FileText },
  { to: '/admin/settings', label: 'Restaurant Settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search meals, orders, customers...',
  pendingOrdersCount,
  unreadEnquiriesCount,
}) => {
  const { adminUser, logout } = useAuth();
  const { settings } = useRestaurant();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [liveCounts, setLiveCounts] = useState<{
    pendingOrders: number;
    unreadEnquiries: number;
  }>({
    pendingOrders: 0,
    unreadEnquiries: 0,
  });

  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      typeof pendingOrdersCount === 'number' &&
      typeof unreadEnquiriesCount === 'number'
    ) {
      setLiveCounts({
        pendingOrders: pendingOrdersCount,
        unreadEnquiries: unreadEnquiriesCount,
      });
      return;
    }

    let active = true;
    async function loadNotificationCounts() {
      try {
        const stats = await dataService.getOverviewStats();
        if (!active) return;
        const pending = (stats.orders || []).filter(
          (o) =>
            o.status === 'pending' ||
            o.status === 'processing' ||
            o.status === 'preparing' ||
            o.status === 'ready_for_pickup' ||
            o.status === 'out_for_delivery'
        ).length;
        setLiveCounts({
          pendingOrders: pending,
          unreadEnquiries: stats.unreadEnquiries ?? 0,
        });
      } catch {
        // Non-blocking header indicator
      }
    }
    void loadNotificationCounts();
    return () => {
      active = false;
    };
  }, [pendingOrdersCount, unreadEnquiriesCount]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const totalAlerts = liveCounts.pendingOrders + liveCounts.unreadEnquiries;
  const currentDateLabel = new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSearchChange && quickSearch.trim()) {
      navigate(`/admin/foods?q=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  const navLinkClass = (isCollapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
    `group flex items-center ${
      isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3.5'
    } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#E85D04] text-white shadow-sm'
        : 'text-[#252525]/80 hover:bg-[#FFF3E8] hover:text-[#E85D04]'
    }`;

  const renderSidebarContent = (isCollapsed: boolean, isMobile = false) => (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200/90 font-admin">
      {/* Brand Header */}
      <div
        className={`h-16 border-b border-neutral-200/90 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link
          to="/admin"
          className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}
          title={restaurantName}
        >
          <div className="w-9 h-9 rounded-xl bg-[#E85D04] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            UR
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#252525] truncate leading-tight">
                {restaurantName}
              </p>
              <p className="text-[11px] font-medium text-[#E85D04] truncate">Admin Portal</p>
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-[#FFF3E8] hover:text-[#E85D04] cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          !isCollapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-[#FFF3E8] hover:text-[#E85D04] transition-colors cursor-pointer"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {!isMobile && isCollapsed && (
        <div className="pt-3 px-2 flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-xl text-neutral-500 hover:bg-[#FFF3E8] hover:text-[#E85D04] transition-colors cursor-pointer"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav aria-label="Admin navigation" className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const badgeCount =
            item.to === '/admin/orders'
              ? liveCounts.pendingOrders
              : item.to === '/admin/enquiries'
              ? liveCounts.unreadEnquiries
              : 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={navLinkClass(isCollapsed)}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-neutral-500 group-hover:text-[#E85D04]'
                    }`}
                    strokeWidth={1.9}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isCollapsed && badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-md tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FFF3E8] text-[#E85D04]'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile + Actions */}
      <div className="p-3 border-t border-neutral-200/90 space-y-2 bg-[#FFF3E8]/40">
        {adminUser && (
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-1' : 'gap-2.5 px-2.5'
            } py-2 rounded-xl bg-white border border-neutral-200/80`}
            title={adminUser.email}
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-neutral-500 leading-tight">
                  Signed in as
                </p>
                <p className="text-xs font-semibold text-[#252525] truncate">
                  {adminUser.email}
                </p>
              </div>
            )}
          </div>
        )}

        <Link
          to="/"
          title={isCollapsed ? 'View Website' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3.5'
          } py-2 rounded-xl text-xs font-semibold text-[#252525] bg-white border border-neutral-200 hover:border-[#E85D04] hover:text-[#E85D04] transition-colors`}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>View Website</span>}
        </Link>

        <button
          type="button"
          onClick={() => void handleLogout()}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3.5'
          } py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex font-admin text-[#252525]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {renderSidebarContent(collapsed)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[82vw] h-full z-10 shadow-xl">
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-neutral-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 rounded-xl text-[#252525] hover:bg-[#FFF3E8] hover:text-[#E85D04] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-neutral-400 hidden sm:inline font-medium">Admin</span>
              <span className="text-neutral-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-[#252525] truncate">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <form onSubmit={handleHeaderSearchSubmit} className="hidden md:block relative w-60 lg:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={onSearchChange ? searchValue ?? '' : quickSearch}
                onChange={(e) =>
                  onSearchChange ? onSearchChange(e.target.value) : setQuickSearch(e.target.value)
                }
                placeholder={searchPlaceholder}
                aria-label="Search dashboard"
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F7] border border-neutral-200 rounded-xl text-[#252525] placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/15 transition-all"
              />
            </form>

            {/* Current Date */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF3E8] text-[#252525] text-xs font-medium whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-[#E85D04]" />
              <span>{currentDateLabel}</span>
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="View notifications"
                className="relative p-2 rounded-xl bg-[#F7F7F7] hover:bg-[#FFF3E8] text-[#252525] hover:text-[#E85D04] border border-neutral-200/80 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E85D04] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {totalAlerts > 99 ? '99+' : totalAlerts}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-neutral-200 shadow-xl p-3 z-40">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                    <p className="text-xs font-bold text-[#252525]">Notifications</p>
                    <span className="text-[11px] font-semibold text-[#E85D04] tabular-nums">
                      {totalAlerts} active
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <Link
                      to="/admin/orders"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F7F7] hover:bg-[#FFF3E8] transition-colors"
                    >
                      <span className="font-medium text-[#252525]">Pending Orders</span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-[#E85D04] font-semibold tabular-nums border border-neutral-200">
                        {liveCounts.pendingOrders}
                      </span>
                    </Link>
                    <Link
                      to="/admin/enquiries"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F7F7] hover:bg-[#FFF3E8] transition-colors"
                    >
                      <span className="font-medium text-[#252525]">Unread Enquiries</span>
                      <span className="px-2 py-0.5 rounded-md bg-white text-[#267A43] font-semibold tabular-nums border border-neutral-200">
                        {liveCounts.unreadEnquiries}
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Chip */}
            <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#F7F7F7] border border-neutral-200/80">
              <div className="w-7 h-7 rounded-lg bg-[#E85D04] text-white flex items-center justify-center text-xs font-bold">
                A
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-xs font-semibold text-[#252525]">Admin</p>
                <p className="text-[10px] text-neutral-500">Manager</p>
              </div>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
