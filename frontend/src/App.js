import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, checkToken } from './services/auth';
import './styles/App.css';

// Компоненти
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import UploadForm from './components/UploadForm';
import TranslateOptions from './pages/TranslateOptions';
import Translations from './pages/Translations';
import History from './pages/History';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import Assistant from './pages/Assistant';

// Захищений маршрут
const ProtectedRoute = ({ children }) => {
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { t, i18n } = useTranslation();
  const [checking, setChecking] = useState(true);
  
  // Перевірка токена при запуску
  useEffect(() => {
    const verifyToken = async () => {
      await checkToken();
      setChecking(false);
    };
    
    verifyToken();
  }, []);
  
  if (checking) {
    return <div className="loading-container">{t('common.loading')}</div>;
  }
  
  return (
    <Router>
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Захищені маршрути */}
        <Route path="/" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <HomePage />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/upload" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <UploadForm />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/translate/:bookId" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <TranslateOptions />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/translations" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Translations />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <History />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/subscription" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Subscription />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Settings />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/assistant" element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Assistant />
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Перенаправлення на головну для всіх інших шляхів */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Кнопка активації програми (для стилістики CleanMyMac) */}
      <a href="/subscription" className="activate-program-button">
        {t('common.activateProgram')}
      </a>
    </Router>
  );
}

export default App;