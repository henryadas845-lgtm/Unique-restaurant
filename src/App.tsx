import React, { Component, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { AuthProvider } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

const AdminLogin = lazy(() =>
  import('./admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const Overview = lazy(() =>
  import('./admin/Overview').then((m) => ({ default: m.Overview }))
);
const ManageFoods = lazy(() =>
  import('./admin/ManageFoods').then((m) => ({ default: m.ManageFoods }))
);
const ManageCategories = lazy(() =>
  import('./admin/ManageCategories').then((m) => ({ default: m.ManageCategories }))
);
const ManageOrders = lazy(() =>
  import('./admin/ManageOrders').then((m) => ({ default: m.ManageOrders }))
);
const ManageEnquiries = lazy(() =>
  import('./admin/ManageEnquiries').then((m) => ({ default: m.ManageEnquiries }))
);
const WebsiteContent = lazy(() =>
  import('./admin/WebsiteContent').then((m) => ({ default: m.WebsiteContent }))
);
const RestaurantSettingsPage = lazy(() =>
  import('./admin/RestaurantSettings').then((m) => ({ default: m.RestaurantSettingsPage }))
);

class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold text-[#252525] mb-2">Something went wrong</h1>
            <p className="text-sm text-neutral-600 mb-4">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] rounded-xl cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminRouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
    <div className="text-sm font-medium text-neutral-600">Loading admin dashboard...</div>
  </div>
);

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <ScrollToTop />
            <Suspense fallback={<AdminRouteFallback />}>
              <Routes>
                {/* Public Multi-Page Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/contact" element={<Contact />} />

                {/* Admin Auth & Protected Dashboard Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Overview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/foods"
                  element={
                    <ProtectedRoute>
                      <ManageFoods />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute>
                      <ManageCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <ManageOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/enquiries"
                  element={
                    <ProtectedRoute>
                      <ManageEnquiries />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/content"
                  element={
                    <ProtectedRoute>
                      <WebsiteContent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute>
                      <RestaurantSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <WhatsAppWidget />
            <ToastContainer />
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
