import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuickTranslatePage } from './pages/QuickTranslatePage';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { LegalAGB } from './pages/legal/AGB';
import { LegalImpressum } from './pages/legal/Impressum';
import { LegalPrivacy } from './pages/legal/Privacy';
import { LegalCookies } from './pages/legal/Cookies';
import { LegalWithdrawal } from './pages/legal/Widerruf';

export default function App() {
  return (
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
  );
}
