import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../widgets/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/legal/agb', label: t('nav.legal') }
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/90 text-white border-b border-white/10 shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-wide hover:text-accent transition-colors">
          Kaminskyi Language Intelligence
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-wide transition-all duration-200 ${
                  isActive ? 'text-accent font-semibold' : 'text-white/80 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="text-sm text-white/80 hover:text-accent transition-colors"
              >
                {user?.username}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-all duration-200"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-all duration-200"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300 transition-all duration-200 shadow-lg shadow-accent/20"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
          <nav className="flex flex-col px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm uppercase tracking-wide transition-colors py-2 ${
                    isActive ? 'text-accent font-semibold' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-white/80 hover:text-accent transition-colors py-2"
                  >
                    {user?.username}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-all"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-all text-center"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300 transition-all text-center"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
