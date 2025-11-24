import React, { useState, useEffect } from 'react';
import { apiUpdateUserRole, apiGetRoles } from "../api";
import RoleEditor from './RoleEditor'; // <-- ИМПОРТ

function Dashboard({ user, onLogout, usersList, onLoadUsers, token }) {
  const [roles, setRoles] = useState([]);

  // Загружаем роли и пользователей при запуске
  const loadRoles = async () => {
    const res = await apiGetRoles(token); 
    if (res.ok) setRoles(res.data);
  };
  
  useEffect(() => {
    // ИСПРАВЛЕНО: Проверка на roleName
    if (user.roleName === 'ADMIN') { 
      loadRoles();
      onLoadUsers();
    }
  }, [user, token]); 
  
  const handleUserRoleChange = async (userId, newRole) => {
     if (!confirm(`Сменить роль на ${newRole}?`)) return;
     const result = await apiUpdateUserRole(userId, newRole, token);
     if (result.ok) onLoadUsers(); 
  };

  return (
    <div className="card">
      <div className="dashboard-header">
        <div>
          <h2>Вы вошли как: {user.name}</h2>
          <p>Роль: {user.roleName}</p> {/* ИСПРАВЛЕНО: user.roleName */}
        </div>
        <button className="danger" onClick={onLogout}>Выйти</button>
      </div>

      {/* ИСПРАВЛЕНО: Проверка на roleName */}
      {user.roleName === 'ADMIN' && ( 
        <>
          {/* --- ИНТЕГРАЦИЯ НОВОГО РЕДАКТОРА --- */}
          <RoleEditor
            token={token}
            roles={roles}
            usersList={usersList}
            loadRoles={loadRoles}
          />
          {/* ------------------------------------- */}

          {/* --- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ --- */}
          <div className="users-section" style={{ marginTop: '30px' }}>
            <h3>Пользователи</h3>
            <button onClick={onLoadUsers}>Обновить список</button>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>
                      {/* ДИНАМИЧЕСКИЙ ВЫБОР РОЛИ */}
                      <select
                        value={u.roleName}
                        onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                        // Запрет на смену своей роли и роли других ADMIN
                        disabled={u.id === user.id || u.roleName === 'ADMIN'}
                      >
                        {/* Мапим роли из базы данных */}
                        {roles.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;