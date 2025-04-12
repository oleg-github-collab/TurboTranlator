import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    language: 'uk'
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валідація форми
    if (!userData.email || !userData.password || !userData.confirmPassword) {
      setError(t('register.fillAllFields'));
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      setError(t('register.passwordsMismatch'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Видаляємо confirmPassword перед відправкою
      const { confirmPassword, ...registerData } = userData;
      
      await register(registerData);
      navigate('/');
    } catch (err) {
      setError(err.error || t('register.registerFailed'));
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
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        
        <h2>{t('register.title')}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={userData.email}
              onChange={handleChange}
              placeholder={t('register.emailPlaceholder')}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('register.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={userData.password}
              onChange={handleChange}
              placeholder={t('register.passwordPlaceholder')}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={userData.confirmPassword}
              onChange={handleChange}
              placeholder={t('register.confirmPasswordPlaceholder')}
              disabled={loading}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="first_name">{t('register.firstName')}</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-input"
                value={userData.first_name}
                onChange={handleChange}
                placeholder={t('register.firstNamePlaceholder')}
                disabled={loading}
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="last_name">{t('register.lastName')}</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-input"
                value={userData.last_name}
                onChange={handleChange}
                placeholder={t('register.lastNamePlaceholder')}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="language">{t('register.language')}</label>
            <select
              id="language"
              name="language"
              className="form-input"
              value={userData.language}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="uk">{t('languages.ukrainian')}</option>
              <option value="en">{t('languages.english')}</option>
              <option value="de">{t('languages.german')}</option>
              <option value="es">{t('languages.spanish')}</option>
              <option value="fr">{t('languages.french')}</option>
            </select>
          </div>
          
          <button type="submit" className="button primary full-width" disabled={loading}>
            {loading ? t('common.loading') : t('register.registerButton')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>{t('register.haveAccount')} <Link to="/login">{t('register.loginNow')}</Link></p>
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

export default Register;