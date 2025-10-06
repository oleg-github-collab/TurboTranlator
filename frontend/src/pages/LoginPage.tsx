import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await login(data.username, data.password);
      const redirect = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="max-w-md self-center rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 text-white shadow-2xl hover:shadow-accent/20 transition-shadow duration-300">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
          {t('auth.loginTitle')}
        </h1>
        <p className="mt-2 text-sm text-white/60">Welcome back!</p>
      </div>
      {error && (
        <div className="mb-4 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium text-white/90 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('auth.username')}
          </label>
          <input
            type="text"
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white placeholder-white/40 focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none transition-all"
            placeholder="Enter your username"
            {...register('username', { required: t('forms.required') as string })}
          />
          {errors.username && (
            <p className="mt-1.5 text-xs text-rose-300 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-white/90 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t('auth.password')}
          </label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white placeholder-white/40 focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none transition-all"
            placeholder="Enter your password"
            {...register('password', { required: t('forms.required') as string })}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-300 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-accent to-sky-400 px-4 py-3.5 text-base font-semibold text-slate-900 hover:shadow-xl hover:shadow-accent/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>
              {t('auth.submitLogin')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-white/70">
          {t('auth.switchToRegister')}{' '}
          <Link to="/register" className="text-accent hover:text-sky-300 font-semibold hover:underline decoration-accent underline-offset-2 transition-colors">
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};
