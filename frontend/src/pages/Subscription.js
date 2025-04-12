import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { paymentService } from '../services/api';

const Subscription = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getSubscriptionPlans();
        setPlans(data.subscription_plans);
        setModels(data.translation_models);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load plans');
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  const handleSubscribe = async (planId) => {
    try {
      const response = await paymentService.createSubscription(planId);
      // Перенаправлення на PayPal для оплати
      window.location.href = response.approval_url;
    } catch (err) {
      setError(err.message || 'Failed to create subscription');
    }
  };
  
  if (loading) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }
  
  return (
    <div>
      <div className="page-header">
        <div className="hex-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>
        <h1>{t('subscription.title')}</h1>
        <p>{t('subscription.subtitle')}</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="section-title">
        <h2>{t('subscription.subscriptionPlans')}</h2>
        <p>{t('subscription.subscriptionDescription')}</p>
      </div>
      
      <div className="plans-grid">
        {plans.map(plan => (
          <div className="plan-card" key={plan.id}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">${plan.price.toFixed(2)}</div>
            </div>
            <div className="plan-details">
              <div className="plan-feature">
                <span className="bonus-badge">+{plan.bonus_percentage}%</span>
                <span>{t('subscription.bonusCredit')}</span>
              </div>
              <p>{plan.description}</p>
            </div>
            <button 
              className="button primary full-width" 
              onClick={() => handleSubscribe(plan.id)}
            >
              {t('subscription.subscribe')}
            </button>
          </div>
        ))}
      </div>
      
      <div className="section-title mt-5">
        <h2>{t('subscription.translationModels')}</h2>
        <p>{t('subscription.modelsDescription')}</p>
      </div>
      
      <div className="models-grid">
        {models.map(model => (
          <div className="model-card" key={model.id}>
            <div className="model-header">
              <h3>{model.name}</h3>
            </div>
            <div className="model-details">
              {model.type === 1 ? (
                <div className="model-price">
                  <strong>${model.price_per_page.toFixed(2)}</strong> {t('subscription.perPage')}
                </div>
              ) : (
                <div className="model-price">
                  <strong>${model.price_per_segment.toFixed(2)}</strong> {t('subscription.perSegment', { chars: model.segment_size })}
                </div>
              )}
              <p>{model.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="info-card mt-5">
        <h3>{t('subscription.howItWorks')}</h3>
        <ul>
          <li>{t('subscription.howItWorksItem1')}</li>
          <li>{t('subscription.howItWorksItem2')}</li>
          <li>{t('subscription.howItWorksItem3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default Subscription;