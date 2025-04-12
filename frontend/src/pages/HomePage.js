import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { t } = useTranslation();
  const [userStatus, setUserStatus] = useState({
    name: '',
    balance: 0,
    pendingJobs: 0,
    completedJobs: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/user/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUserStatus(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  return (
    <div>
      <div className="page-header">
        <div className="hex-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1>{t('home.welcome', { name: userStatus.name || t('home.user') })}</h1>
        <p>{t('home.subtitle')}</p>
      </div>
      
      {loading ? (
        <div className="loading-spinner">{t('common.loading')}</div>
      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <h3>{t('home.yourBalance')}</h3>
            <div className="balance-amount">${userStatus.balance.toFixed(2)}</div>
            <Link to="/subscription" className="button outline mt-3">
              {t('home.addFunds')}
            </Link>
          </div>
          
          <div className="card">
            <h3>{t('home.pendingTranslations')}</h3>
            <div className="stat-number">{userStatus.pendingJobs}</div>
            <Link to="/translations" className="button outline mt-3">
              {t('home.viewTranslations')}
            </Link>
          </div>
          
          <div className="card">
            <h3>{t('home.completedTranslations')}</h3>
            <div className="stat-number">{userStatus.completedJobs}</div>
            <Link to="/history" className="button outline mt-3">
              {t('home.viewHistory')}
            </Link>
          </div>
        </div>
      )}
      
      <div className="card text-center mt-5">
        <h2>{t('home.startTranslating')}</h2>
        <p>{t('home.uploadDescription')}</p>
        <Link to="/upload" className="scan-button">
          {t('home.scan')}
        </Link>
      </div>
      
      <div className="card mt-5">
        <h3>{t('home.howItWorks')}</h3>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>{t('home.step1Title')}</h4>
            <p>{t('home.step1Description')}</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h4>{t('home.step2Title')}</h4>
            <p>{t('home.step2Description')}</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h4>{t('home.step3Title')}</h4>
            <p>{t('home.step3Description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;