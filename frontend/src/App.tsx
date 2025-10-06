import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Lazy load heavy pages
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const QuickTranslatePage = lazy(() => import('./pages/QuickTranslatePage').then(m => ({ default: m.QuickTranslatePage })));
const LegalAGB = lazy(() => import('./pages/legal/AGB').then(m => ({ default: m.LegalAGB })));
const LegalImpressum = lazy(() => import('./pages/legal/Impressum').then(m => ({ default: m.LegalImpressum })));
const LegalPrivacy = lazy(() => import('./pages/legal/Privacy').then(m => ({ default: m.LegalPrivacy })));
const LegalCookies = lazy(() => import('./pages/legal/Cookies').then(m => ({ default: m.LegalCookies })));
const LegalWithdrawal = lazy(() => import('./pages/legal/Widerruf').then(m => ({ default: m.LegalWithdrawal })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      <p className="text-sm text-white/60">Loading...</p>
    </div>
  </div>
);

export default function App() {
  useKeyboardShortcuts();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="quick-translate" element={<QuickTranslatePage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="legal">
            <Route path="agb" element={<LegalAGB />} />
            <Route path="impressum" element={<LegalImpressum />} />
            <Route path="datenschutz" element={<LegalPrivacy />} />
            <Route path="cookies" element={<LegalCookies />} />
            <Route path="widerruf" element={<LegalWithdrawal />} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
