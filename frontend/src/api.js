const API_BASE_URL = "http://localhost:3000";

export async function apiRegister(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

export async function apiLogin(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

export async function apiGetMe(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

export async function apiGetUsers(token) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return res.json().then(data => ({ ok: res.ok, data }));
}

// --- НОВЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ РОЛЯМИ ---

// 1. Обновление роли пользователя
export async function apiUpdateUserRole(userId, newRole, token) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    // На бэкенде это деструктурируется в role: newRoleName
    body: JSON.stringify({ role: newRole }), 
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

// 2. Получить список ролей
export async function apiGetRoles(token) {
  const res = await fetch(`${API_BASE_URL}/api/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

// 3. Создать роль
export async function apiCreateRole(name, token) {
  const res = await fetch(`${API_BASE_URL}/api/roles`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ name }),
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

// 4. Удалить роль
export async function apiDeleteRole(id, token) {
  const res = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json().then(data => ({ ok: res.ok, data }));
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ SQL РЕДАКТОРА ---

export async function apiExecuteSql(sql, token) {
  const res = await fetch(`${API_BASE_URL}/api/sql/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ sql }),
  });
  return res.json().then(data => ({ ok: res.ok, data })); 
}