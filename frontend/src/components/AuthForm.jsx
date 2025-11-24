import React, { useState } from 'react';

function AuthForm({ onRegister, onLogin }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="card">
      <div className="tabs">
        <button
          className={tab === 'login' ? 'active' : ''}
          onClick={() => setTab('login')}
        >
          Вход
        </button>
        <button
          className={tab === 'register' ? 'active' : ''}
          onClick={() => setTab('register')}
        >
          Регистрация
        </button>
      </div>

      {tab === 'login' && (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={() => onLogin(email, password)}>Войти</button>
        </div>
      )}

      {tab === 'register' && (
        <div>
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={() => onRegister(email, password, name)}>Зарегистрироваться</button>
        </div>
      )}
    </div>
  );
}

export default AuthForm;
