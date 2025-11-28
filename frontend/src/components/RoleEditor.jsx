// frontend/src/components/RoleEditor.jsx

import { useState } from "react";
import { apiCreateRole, apiDeleteRole, apiTestPerm } from "../api"; 
import RolePermissionManager from "./RolePermissionManager";

export default function RoleEditor({ roles, token, reload }) {
  const [newRole, setNewRole] = useState("");
  const [editRole, setEditRole] = useState(null);
  const [testR, setTestR] = useState("USER");
  const [testP, setTestP] = useState("user:read");

  const add = async () => { await apiCreateRole(newRole, token); setNewRole(""); reload(); };
  const del = async (id) => { await apiDeleteRole(id, token); reload(); };
  
  const runTest = async () => { 
      const { ok, data } = await apiTestPerm({ roleName: testR, permName: testP }, token);
      if (ok) {
          alert(data.has ? 'ДА ✅' : 'НЕТ ❌');
      } else {
          alert(`Ошибка запроса: ${data.message || 'Неизвестная ошибка'}`);
      }
  };


  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      {/* 1. Роли */}
      <div className="card">
        <h3>Роли</h3>
        <input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="Новая роль"/>
        <button onClick={add}>+</button>
        <ul>{roles.map(r => (
          <li key={r.id}>
            <b>{r.name}</b> 
            <button onClick={() => setEditRole(editRole === r.id ? null : r.id)}>✏️</button>
            {r.name!=='ADMIN' && r.name!=='USER' && <button onClick={()=>del(r.id)} style={{color:'red'}}>X</button>}
            {editRole === r.id && <RolePermissionManager role={r} token={token} onUpdate={reload} onClose={()=>setEditRole(null)}/>}\n
          </li>
        ))}</ul>
      </div>

      {/* 2. Тест прав (оставляем) */}
      <div className="card">
        <h4>Тест прав</h4>
        <select value={testR} onChange={e=>setTestR(e.target.value)} style={{marginRight:10}}>
            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <input value={testP} onChange={e=>setTestP(e.target.value)} placeholder="Имя права (e.g. user:read)" style={{marginRight:10}}/>
        <button onClick={runTest}>Тест</button>
      </div>
    </div>
  );
}