import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('login.fillAllFields'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.error || t('login.authFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="hex-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3z"/>
            </svg>
          </div>
        </div>
        
        <h2>{t('login.title')}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="button primary full-width" disabled={loading}>
            {loading ? t('common.loading') : t('login.loginButton')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>{t('login.noAccount')} <Link to="/register">{t('login.registerNow')}</Link></p>
        </div>
      </div>
      
      <div className="language-selector">
        <select
          onChange={(e) => {
            const language = e.target.value;
            // i18n.changeLanguage(language);
          }}
          // value={i18n.language}
        >
          <option value="uk">{t('languages.ukrainian')}</option>
          <option value="en">{t('languages.english')}</option>
          <option value="de">{t('languages.german')}</option>
          <option value="es">{t('languages.spanish')}</option>
          <option value="fr">{t('languages.french')}</option>
        </select>
      </div>
    </div>
  );
};

export default Login;