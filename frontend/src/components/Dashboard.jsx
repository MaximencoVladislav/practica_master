// frontend/src/components/Dashboard.jsx

import { useEffect, useState } from "react";
import { apiGetUsers, apiGetRoles, apiUpdateUserRole } from "../api";
import RoleEditor from "./RoleEditor";
import EndpointConstructor from "./EndpointConstructor"; // Импорт нового компонента

const TABS = {
  USERS: 'USERS',
  ROLES: 'ROLES',
  ENDPOINTS: 'ENDPOINTS'
};

export default function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS.USERS);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Проверяем права через массив permissions
  const canReadUsers = user.permissions.includes('user:read') || user.roleName === 'ADMIN';
  const canManageRoles = user.permissions.includes('role:manage') || user.roleName === 'ADMIN';
  const canManageEndpoints = user.permissions.includes('admin:manage_endpoints') || user.roleName === 'ADMIN';
  
  // Если у пользователя нет права читать пользователей, но есть право управлять ролями,
  // устанавливаем вкладку по умолчанию на Роли.
  useEffect(() => {
    if (!canReadUsers && canManageRoles) {
        setActiveTab(TABS.ROLES);
    } else if (!canReadUsers && !canManageRoles && canManageEndpoints) {
        setActiveTab(TABS.ENDPOINTS);
    }
  }, [canReadUsers, canManageRoles, canManageEndpoints]);


  const load = async () => {
    if (canReadUsers) {
        const { ok, data } = await apiGetUsers(token);
        if (ok) setUsers(data);
    }
    if (canManageRoles) {
        const { ok, data } = await apiGetRoles(token);
        if (ok) setRoles(data);
    }
  };
  useEffect(() => { load(); }, []); // Загрузка данных при монтировании

  const handleUserRoleChange = async (id, newRoleName) => {
    await apiUpdateUserRole(id, newRoleName, token);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{user.name} ({user.roleName})</h2>
      <button onClick={onLogout}>Выход</button>
      
      <hr/>
      
      {/* --- Навигация --- */}
      <nav style={{ marginBottom: 20 }}>
        {canReadUsers && (
            <button 
                onClick={() => setActiveTab(TABS.USERS)}
                style={{ fontWeight: activeTab === TABS.USERS ? 'bold' : 'normal', marginRight: 10 }}
            >
                Пользователи
            </button>
        )}
        {canManageRoles && (
            <button 
                onClick={() => setActiveTab(TABS.ROLES)}
                style={{ fontWeight: activeTab === TABS.ROLES ? 'bold' : 'normal', marginRight: 10 }}
            >
                Роли
            </button>
        )}
        {canManageEndpoints && (
            <button 
                onClick={() => setActiveTab(TABS.ENDPOINTS)}
                style={{ fontWeight: activeTab === TABS.ENDPOINTS ? 'bold' : 'normal' }}
            >
                Конструктор Endpoint'ов
            </button>
        )}
      </nav>

      <hr/>

      {/* --- Содержимое вкладок --- */}
      {activeTab === TABS.USERS && canReadUsers && (
        <div className="card">
          <h3>Пользователи</h3>
          <button onClick={load} style={{marginBottom: 10}}>Обновить список</button>
          <table style={{width: '100%', textAlign: 'left'}}>
            <thead><tr><th>ID</th><th>Email</th><th>Роль</th></tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  <select 
                    value={u.roleName} 
                    onChange={e => handleUserRoleChange(u.id, e.target.value)}
                    disabled={!canManageRoles || u.roleName === 'ADMIN' || u.id === user.id} // Нельзя менять роль самому себе и ADMIN
                  >
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {activeTab === TABS.ROLES && canManageRoles && (
          <RoleEditor roles={roles} token={token} reload={load} />
      )}

      {activeTab === TABS.ENDPOINTS && canManageEndpoints && (
          <EndpointConstructor token={token} /> 
      )}

      {!canReadUsers && !canManageRoles && !canManageEndpoints && (
          <p className="card">У вас нет прав доступа к административным инструментам.</p>
      )}
    </div>
  );
}