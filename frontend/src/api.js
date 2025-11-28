// frontend/src/api.js

const URL = "http://localhost:3000";
const headers = (t) => ({ "Content-Type": "application/json", "Authorization": `Bearer ${t}` });

// Вспомогательная функция для обработки ответа (предполагаем, что она есть)
async function handleResponse(res) {
    if (res.ok) {
      let data = await res.json();
      return { ok: true, data };
    } else {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { message: 'Ошибка авторизации или пустой ответ сервера' };
      }
      return { ok: false, data };
    }
}

// --- АВТОРИЗАЦИЯ ---
export const apiRegister = (payload) => fetch(`${URL}/auth/register`, { method: 'POST', headers: headers(null), body: JSON.stringify(payload) }).then(handleResponse);
export const apiLogin = (payload) => fetch(`${URL}/auth/login`, { method: 'POST', headers: headers(null), body: JSON.stringify(payload) }).then(handleResponse);
export const apiGetMe = (t) => fetch(`${URL}/auth/me`, { headers: headers(t) }).then(handleResponse);

// --- ПОЛЬЗОВАТЕЛИ ---
export const apiGetUsers = (t) => fetch(`${URL}/api/users`, { headers: headers(t) }).then(handleResponse);
export const apiUpdateUserRole = (id, r, t) => fetch(`${URL}/api/users/${id}/role`, { method:'PATCH', headers: headers(t), body:JSON.stringify({roleName: r}) }).then(handleResponse);

// --- РОЛИ И ПРАВА ---
export const apiGetRoles = (t) => fetch(`${URL}/api/roles`, { headers: headers(t) }).then(handleResponse);
export const apiGetPerms = (t) => fetch(`${URL}/api/roles/list`, { headers: headers(t) }).then(handleResponse);
export const apiCreateRole = (n, t) => fetch(`${URL}/api/roles`, { method:'POST', headers: headers(t), body:JSON.stringify({name:n}) }).then(handleResponse);
export const apiDeleteRole = (id, t) => fetch(`${URL}/api/roles/${id}`, { method:'DELETE', headers: headers(t) }).then(handleResponse);
export const apiTogglePerm = (d, t) => fetch(`${URL}/api/roles/toggle_perm`, { method:'POST', headers: headers(t), body:JSON.stringify(d) }).then(handleResponse);
export const apiTestPerm = (d, t) => fetch(`${URL}/api/roles/test_perm`, { method:'POST', headers: headers(t), body:JSON.stringify(d) }).then(handleResponse);
export const apiExecSql = (sql, t) => fetch(`${URL}/api/roles/sql`, { method:'POST', headers: headers(t), body:JSON.stringify({sql}) }).then(handleResponse);

// --- НОВЫЕ ФУНКЦИИ ДЛЯ ADMIN ENDPOINT'ОВ ---

export async function apiGetAdminEndpoints(token) {
  const res = await fetch(`${URL}/api/roles/endpoints`, { headers: headers(token) });
  return handleResponse(res);
}

export async function apiCreateAdminEndpoint(payload, token) {
  const res = await fetch(`${URL}/api/roles/endpoints`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function apiUpdateAdminEndpoint(id, payload, token) {
  const res = await fetch(`${URL}/api/roles/endpoints/${id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function apiDeleteAdminEndpoint(id, token) {
  const res = await fetch(`${URL}/api/roles/endpoints/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return handleResponse(res);
}