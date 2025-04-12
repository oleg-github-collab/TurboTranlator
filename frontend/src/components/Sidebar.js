import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';

// Імпорт іконок у вигляді компонентів
import HomeIcon from './icons/HomeIcon';
import UploadIcon from './icons/UploadIcon';
import TranslateIcon from './icons/TranslateIcon';
import HistoryIcon from './icons/HistoryIcon';
import SubscriptionIcon from './icons/SubscriptionIcon';
import SettingsIcon from './icons/SettingsIcon';
import AssistantIcon from './icons/AssistantIcon';

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="sidebar">
      <NavLink to="/" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <HomeIcon className="sidebar-item-icon" />
        <span>{t('sidebar.home')}</span>
      </NavLink>
      
      <NavLink to="/upload" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <UploadIcon className="sidebar-item-icon" />
        <span>{t('sidebar.upload')}</span>
      </NavLink>
      
      <NavLink to="/translations" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <TranslateIcon className="sidebar-item-icon" />
        <span>{t('sidebar.translations')}</span>
      </NavLink>
      
      <NavLink to="/history" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <HistoryIcon className="sidebar-item-icon" />
        <span>{t('sidebar.history')}</span>
      </NavLink>
      
      <NavLink to="/subscription" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <SubscriptionIcon className="sidebar-item-icon" />
        <span>{t('sidebar.subscription')}</span>
      </NavLink>
      
      <NavLink to="/settings" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <SettingsIcon className="sidebar-item-icon" />
        <span>{t('sidebar.settings')}</span>
      </NavLink>
      
      <div className="sidebar-spacer"></div>
      
      <NavLink to="/assistant" className={({ isActive }) => 
        isActive ? "sidebar-item active" : "sidebar-item"
      }>
        <AssistantIcon className="sidebar-item-icon" />
        <span>{t('sidebar.assistant')}</span>
      </NavLink>
    </div>
  );
};

export default Sidebar;