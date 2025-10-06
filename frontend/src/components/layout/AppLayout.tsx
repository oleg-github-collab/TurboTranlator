import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieConsent } from '../widgets/CookieConsent';
import { OnboardingModal } from '../modals/OnboardingModal';

export const AppLayout = () => (
  <div className="min-h-screen bg-slate-900 text-white">
    <Header />
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
      <Outlet />
    </main>
    <Footer />
    <CookieConsent />
    <OnboardingModal />
  </div>
);
