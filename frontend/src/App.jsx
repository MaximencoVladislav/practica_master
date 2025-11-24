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

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const { ok, data } = await apiGetMe(token);
      if (ok) {
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
      <h1>Admin Panel</h1>
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
          onLogout={handleLogout}
          usersList={usersList}
          onLoadUsers={loadUsers}
        />
      )}
    </div>
  );
}

export default App;
