import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Імпортуємо заглушки компонентів (можна буде замінити на реальні)
const Home = () => <div>Головна сторінка TurboTranslator</div>;
const Login = () => <div>Сторінка входу</div>;
const Register = () => <div>Сторінка реєстрації</div>;
const Dashboard = () => <div>Панель користувача</div>;

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TurboTranslator</h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;