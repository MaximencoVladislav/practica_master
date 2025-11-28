// frontend/src/App.jsx

import React, { useEffect, useState } from 'react';
import { apiLogin, apiRegister, apiGetMe, apiGetUsers } from './api';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 1. ЭФФЕКТ ДЛЯ ВРЕМЕННОГО УВЕДОМЛЕНИЯ
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000); // Сообщение исчезнет через 3 секунды
      return () => clearTimeout(timer); // Очистка таймера
    }
  }, [message]);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const { ok, data } = await apiGetMe(token);
      if (ok) {
        // Устанавливаем пользователя, который включает roleName и permissions
        setUser(data);
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const handleRegister = async (email, password, name) => {
    setMessage('');
    const { ok, data } = await apiRegister({ email, password, name });
    if (ok) {
      // data.user уже содержит roleName и permissions благодаря исправлению в auth.js
      setMessage(`Пользователь ${data.user.name} зарегистрирован, теперь войдите.`);
    } else {
      setMessage(data.message || 'Ошибка регистрации');
    }
  };

  const handleLogin = async (email, password) => {
    setMessage('');
    const { ok, data } = await apiLogin({ email, password });
    if (ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      // data.user уже содержит roleName и permissions благодаря исправлению в auth.js
      setUser(data.user); 
      setMessage('Вход успешен!');
    } else {
      setMessage(data.message || 'Ошибка входа');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setUsersList([]);
    setMessage('Вы вышли из системы.');
  };

  const loadUsers = async () => {
    if (!token) return;
    const { ok, data } = await apiGetUsers(token);
    if (ok) {
      setUsersList(data);
    } else {
      setMessage(data.message || 'Ошибка получения пользователей');
    }
  };

  if (loading) return <div className="container"><p>Загрузка...</p></div>;

  return (
    <div className="container">
      {/* 2. НАВИГАЦИОННАЯ ПАНЕЛЬ */}
      <nav className="nav-bar">
        <h1>Admin Panel</h1>
        {user && (
          <div className="user-info">
            {/* Используем roleName */}
            <span>{user.name || user.email} ({user.roleName})</span> 
            <button className="danger" onClick={handleLogout}>Выйти</button>
          </div>
        )}
      </nav>

      {/* 3. ВРЕМЕННОЕ УВЕДОМЛЕНИЕ */}
      {message && <div className="message">{message}</div>}

      {!user && (
        <AuthForm
          onRegister={handleRegister}
          onLogin={handleLogin}
        />
      )}

      {user && (
        <Dashboard
          user={user}
          token={token}
          onLoadUsers={loadUsers}
          usersList={usersList}
          // onLogout удален, так как кнопка теперь в <nav>
        />
      )}
    </div>
  );
}

export default App;