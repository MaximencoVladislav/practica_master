import React, { useState } from 'react';
import { apiCreateRole, apiDeleteRole, apiExecuteSql } from "../api";

// Вспомогательный компонент для отображения результатов SELECT
const SQLResultTable = ({ data }) => {
    if (!data || data.length === 0) return <p>Нет данных для отображения.</p>;

    // Берем ключи из первого объекта как заголовки столбцов
    const columns = Object.keys(data[0]);

    return (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                <thead>
                    <tr style={{ background: '#007bff', color: 'white' }}>
                        {columns.map(col => <th key={col} style={{ border: '1px solid #ddd', padding: '10px' }}>{col}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} style={{ background: index % 2 === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {columns.map(col => (
                                <td key={col} style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {row[col] instanceof Date ? row[col].toLocaleString() : String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function RoleEditor({ token, roles, usersList, loadRoles }) {
    const [newRoleName, setNewRoleName] = useState('');
    const [sqlQuery, setSqlQuery] = useState('SELECT id, email, roleName FROM User LIMIT 10;');
    const [sqlResult, setSqlResult] = useState(null);
    const [sqlMessage, setSqlMessage] = useState({ type: '', text: '' });
    
    const [testUserId, setTestUserId] = useState(usersList[0]?.id || ''); 

    // --- УПРАВЛЕНИЕ РОЛЯМИ: Добавление ---

    const handleAddRole = async () => {
        if (!newRoleName) return;
        const res = await apiCreateRole(newRoleName.toUpperCase(), token);
        if (res.ok) {
            setNewRoleName('');
            loadRoles(); 
        } else {
            alert(`Ошибка: ${res.data.message}`);
        }
    };

    // --- УПРАВЛЕНИЕ РОЛЯМИ: Удаление ---

    const handleDeleteRole = async (id, name) => {
        if (name === 'ADMIN' || name === 'USER') {
            alert('Нельзя удалять стандартные роли ADMIN и USER.');
            return;
        }
        if (!confirm(`Вы действительно хотите удалить роль "${name}"?`)) return;
        
        const res = await apiDeleteRole(id, token);
        if (res.ok) {
            loadRoles();
        } else {
            alert(`Ошибка: ${res.data.message}`);
        }
    };

    // --- РЕДАКТОР SQL: Выполнение запроса ---

    const handleExecuteSql = async () => {
        setSqlResult(null);
        setSqlMessage({ type: '', text: '' });

        if (!sqlQuery.trim()) {
            setSqlMessage({ type: 'error', text: 'Запрос не может быть пустым.' });
            return;
        }

        const { ok, data } = await apiExecuteSql(sqlQuery, token);
        
        if (ok) {
            setSqlMessage({ type: 'success', text: data.message });
            if (data.type === 'select' && Array.isArray(data.data)) {
                setSqlResult(data.data);
            } else if (data.type === 'dml') {
                setSqlResult([{ 'Затронуто записей': data.affectedRows }]);
            } else {
                setSqlResult(null);
            }
        } else {
            setSqlMessage({ 
                type: 'error', 
                text: `${data.message || 'Неизвестная ошибка.'} Детали: ${data.error || 'нет'}`
            });
        }
    };
    
    // --- ПРОВЕРКА ПРАВ (Placeholder) ---

    const handleTestAccess = () => {
        const userToTest = usersList.find(u => u.id === parseInt(testUserId));
        alert(`Функция проверки доступа к API/БД для пользователя "${userToTest?.name || 'не найден'}" пока не реализована на бэкенде.`);
    };


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }}>
            
            {/* 1. РЕДАКТОР РОЛЕЙ (Левая колонка) */}
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#fff' }}>
                <h3>Управление ролями</h3>
                
                <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input 
                        type="text" 
                        placeholder="Название новой роли (напр. EDITOR)" 
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button onClick={handleAddRole} style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                        Добавить роль
                    </button>
                </div>

                <h4>Существующие роли:</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {roles.map(r => (
                        <span key={r.id} style={{ 
                            background: r.name === 'ADMIN' ? '#007bff' : r.name === 'USER' ? '#ffc107' : '#e9ecef', 
                            color: r.name === 'ADMIN' ? 'white' : 'black',
                            padding: '5px 10px', 
                            borderRadius: '4px', 
                            border: '1px solid #ccc',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            fontWeight: r.name === 'ADMIN' || r.name === 'USER' ? 'bold' : 'normal'
                        }}>
                            {r.name}
                            {r.name !== 'ADMIN' && r.name !== 'USER' && (
                                <button 
                                    style={{ background: 'red', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '2px 5px', borderRadius: '50%', lineHeight: '1' }}
                                    onClick={() => handleDeleteRole(r.id, r.name)}
                                >X</button>
                            )}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* 2. РЕДАКТОР SQL (Правая колонка) */}
            <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
                <h3>Редактор SQL</h3>
                
                <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows="8"
                    placeholder="Введите SQL запрос (например, SELECT id, email, roleName FROM User LIMIT 10)"
                    style={{ width: '100%', padding: '10px', fontFamily: 'monospace', resize: 'vertical', border: '1px solid #007bff' }}
                ></textarea>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    
                    <button onClick={handleExecuteSql} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                        TEST SQL
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ whiteSpace: 'nowrap' }}>Проверить права для:</label>
                        <select
                            value={testUserId}
                            onChange={(e) => setTestUserId(e.target.value)}
                            style={{ padding: '8px' }}
                        >
                            {usersList.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.roleName})
                                </option>
                            ))}
                        </select>
                        <button onClick={handleTestAccess} style={{ padding: '10px 15px', background: '#ffc107', color: 'black', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                            Test API (TBD)
                        </button>
                    </div>

                </div>

                {sqlMessage.text && (
                    <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        backgroundColor: sqlMessage.type === 'success' ? '#d4edda' : '#f8d7da', 
                        color: sqlMessage.type === 'success' ? '#155724' : '#721c24', 
                        border: `1px solid ${sqlMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                        {sqlMessage.text}
                    </div>
                )}

                {sqlResult && sqlResult.length > 0 && sqlMessage.type === 'success' && (
                    <div style={{ marginTop: '15px' }}>
                        <h4>Результат:</h4>
                        <SQLResultTable data={sqlResult} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoleEditor;