import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminLogin } from './admin/AdminLogin';
import { ManageCategories } from './admin/ManageCategories';
import { ManageEnquiries } from './admin/ManageEnquiries';
import { ManageFoods } from './admin/ManageFoods';
import { ManageOrders } from './admin/ManageOrders';
import { Overview } from './admin/Overview';
import { RestaurantSettingsPage } from './admin/RestaurantSettings';
import { WebsiteContent } from './admin/WebsiteContent';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { AuthProvider } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestaurantProvider>
          <ScrollToTop />
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
          <WhatsAppWidget />
          <ToastContainer />
        </RestaurantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
