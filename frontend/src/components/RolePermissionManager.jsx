// frontend/src/components/RolePermissionManager.jsx

import { useEffect, useState } from "react";
import { apiGetPerms, apiTogglePerm } from "../api";

export default function RolePermissionManager({ role, token, onUpdate, onClose }) {
  const [allPerms, setAllPerms] = useState([]);

  useEffect(() => { 
    // !!! ИСПРАВЛЕНИЕ: Извлекаем массив data из объекта ответа !!!
    apiGetPerms(token).then(res => {
      if (res.ok) {
        // Устанавливаем стейт равным массиву прав
        setAllPerms(res.data); 
      } else {
        console.error("Failed to load permissions:", res.data.message);
        // В случае ошибки оставляем стейт пустым массивом
        setAllPerms([]); 
      }
    }); 
  }, [token]);

  const toggle = async (permId, current) => {
    await apiTogglePerm({ roleId: role.id, permissionId: permId, enable: !current }, token);
    onUpdate();
  };
  
  // Мы предполагаем, что role.permissions это массив объектов, 
  // где у каждого есть поле permissionId.
  const myPerms = role.permissions.map(p => p.permissionId);

  return (
    <div style={{ border: '2px solid blue', padding: 10, background: '#f9f9ff' }}>
      <h4>Права для: {role.name}</h4>
      {/* Теперь allPerms гарантированно является массивом (allPerms.map) */}
      {allPerms.map(p => (
        <label key={p.id} style={{display:'block'}}>
          <input 
            type="checkbox" 
            checked={myPerms.includes(p.id)} 
            onChange={() => toggle(p.id, myPerms.includes(p.id))} 
            disabled={role.name === 'ADMIN'} 
          />
          {p.name}
        </label>
      ))}
      <button onClick={onClose} style={{marginTop:10}}>Закрыть</button>
    </div>
  );
}