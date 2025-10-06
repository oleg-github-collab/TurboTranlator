import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RegisterFormValues {
  username: string;
  password: string;
  confirm: string;
  agb: boolean;
}

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    defaultValues: { username: '', password: '', confirm: '', agb: false }
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await registerUser(data.username, data.password, data.confirm, data.agb);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="max-w-md self-center rounded-3xl border border-white/15 bg-white/10 p-8 text-white shadow-2xl">
      <h1 className="text-2xl font-semibold">{t('auth.registerTitle')}</h1>
      {error && <p className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-sm text-rose-200">{error}</p>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm text-white/70">{t('auth.username')}</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white focus:border-accent focus:outline-none"
            {...register('username', { required: t('forms.required') as string })}
          />
          {errors.username && <p className="mt-1 text-xs text-rose-300">{errors.username.message}</p>}
        </div>
        <div>
          <label className="text-sm text-white/70">{t('auth.password')}</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white focus:border-accent focus:outline-none"
            {...register('password', {
              required: t('forms.required') as string,
              minLength: { value: 8, message: t('forms.passwordPolicy') as string }
            })}
          />
          {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>}
        </div>
        <div>
          <label className="text-sm text-white/70">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-white focus:border-accent focus:outline-none"
            {...register('confirm', {
              required: t('forms.required') as string,
              validate: (value) => value === password || t('forms.passwordPolicy')
            })}
          />
          {errors.confirm && <p className="mt-1 text-xs text-rose-300">{errors.confirm.message}</p>}
        </div>
        <label className="flex items-start gap-2 text-sm text-white/70">
          <input type="checkbox" className="mt-1" {...register('agb', { required: true })} />
          <span>{t('auth.agb')}</span>
        </label>
        {errors.agb && <p className="text-xs text-rose-300">{t('forms.required')}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-accent px-4 py-3 text-base font-semibold text-slate-900 hover:bg-sky-300 disabled:opacity-60"
        >
          {isSubmitting ? '...' : t('auth.submitRegister')}
        </button>
      </form>
      <p className="mt-6 text-sm text-white/70">
        {t('auth.switchToLogin')}{' '}
        <Link to="/login" className="text-accent hover:underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
};
