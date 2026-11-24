import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isSupabaseConfigured } from '../lib/supabase';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { adminUser, authLoading, needsInitialSetup, login, claimInitialAdmin, changePassword } =
    useAuth();
  const { addToast, settings } = useRestaurant();

  useDocumentTitle('Admin Login | Unique Restaurant');

  const [email, setEmail] = useState('');
  const [showEmailField, setShowEmailField] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && adminUser && !adminUser.mustChangePassword) {
      navigate('/admin', { replace: true });
    }
  }, [adminUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const user = await login(password, showEmailField ? email : undefined);
      if (user.mustChangePassword) {
        setCurrentPassword(password);
        addToast({
          type: 'info',
          title: 'Password update required',
          description: 'Please set a new personal password before entering the dashboard.',
        });
      } else {
        addToast({ type: 'success', title: 'Signed in to Admin Dashboard' });
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await claimInitialAdmin(password);
      addToast({ type: 'success', title: 'Admin password saved' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast({ type: 'success', title: 'Password updated successfully' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  };

  const restaurantName = settings?.restaurant_name || 'Unique Restaurant';

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center py-12 px-4 sm:px-6 font-admin text-[#252525]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-[#E85D04] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {restaurantName}</span>
        </Link>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#FFF3E8] text-[#E85D04] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#252525]">
                {restaurantName}
              </h1>
              <p className="text-xs text-neutral-500">
                {adminUser?.mustChangePassword
                  ? 'First-Login Password Update Required'
                  : needsInitialSetup
                  ? 'Set Admin Password'
                  : 'Owner & Admin Portal'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authLoading ? (
            <div className="py-8 text-center text-sm text-neutral-500">Checking authentication...</div>
          ) : adminUser?.mustChangePassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="p-3.5 bg-[#FFF3E8] border border-[#E85D04]/20 rounded-xl text-xs text-[#252525] leading-relaxed">
                For your security, please replace the temporary starter password with a personal password (at least 8 characters) before accessing the dashboard.
              </div>

              <div>
                <label htmlFor="curr_pw" className="block text-sm font-medium text-[#252525] mb-1.5">
                  Temporary Password
                </label>
                <input
                  id="curr_pw"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label htmlFor="new_pw" className="block text-sm font-medium text-[#252525] mb-1.5">
                  New Personal Password
                </label>
                <input
                  id="new_pw"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <div>
                <label htmlFor="conf_new_pw" className="block text-sm font-medium text-[#252525] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="conf_new_pw"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="accent-[#E85D04]"
                />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {submitting ? 'Updating Password...' : 'Save New Password & Continue'}
              </button>
            </form>
          ) : needsInitialSetup ? (
            <form onSubmit={handleClaimSetup} className="space-y-4">
              <div className="p-3.5 bg-[#FFF3E8] border border-[#E85D04]/20 rounded-xl text-xs text-[#252525] leading-relaxed">
                Welcome! Enter your chosen admin password below to lock and protect your dashboard. Afterward, you will log in with this password alone.
              </div>

              <div>
                <label htmlFor="setup_pw" className="block text-sm font-medium text-[#252525] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="setup_pw"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoFocus
                    placeholder="Enter your admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="setup_pw_conf" className="block text-sm font-medium text-[#252525] mb-1.5">
                  Confirm Admin Password
                </label>
                <input
                  id="setup_pw_conf"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Re-enter your admin password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {submitting ? 'Saving Passcode...' : 'Set Password & Open Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {isSupabaseConfigured && showEmailField && (
                <div>
                  <label htmlFor="login_email" className="block text-sm font-medium text-[#252525] mb-1.5">
                    Admin Email
                  </label>
                  <input
                    id="login_email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@uniquerestaurant.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="login_password" className="block text-sm font-medium text-[#252525] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="login_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="current-password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-11 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#E85D04] hover:bg-[#c84b00] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {submitting ? 'Signing In...' : 'Login to Dashboard'}
              </button>

              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={() => setShowEmailField((v) => !v)}
                  className="w-full text-center text-xs text-neutral-500 hover:text-[#252525] pt-1"
                >
                  {showEmailField ? 'Hide email field' : 'Use a different admin email'}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
