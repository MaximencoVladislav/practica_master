// frontend/src/components/EndpointConstructor.jsx

import { useState, useEffect } from "react";
import { 
    apiExecSql, 
    apiGetAdminEndpoints, 
    apiCreateAdminEndpoint, 
    apiUpdateAdminEndpoint, 
    apiDeleteAdminEndpoint 
} from "../api"; 


// --- Вспомогательный компонент для отображения результатов SQL ---
function SqlResultDisplay({ response }) {
    if (!response) return null;

    const { ok: httpOk, data } = response;
    
    if (!httpOk || !data.ok) {
        return (
            <div style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', borderRadius: '4px', marginTop: '15px', textAlign: 'left' }}>
                <strong>Ошибка:</strong> {data.message || data.data?.message || 'Неизвестная ошибка сервера'}
            </div>
        );
    }

    const result = data.result;

    if (Array.isArray(result) && result.length > 0) {
        const isDMLResult = result.length === 1 && (result[0].affectedRows !== undefined || result[0].count !== undefined);

        if (isDMLResult) {
             const count = result[0].affectedRows || result[0].count || 0;
             return (
                <div style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '4px', marginTop: '15px', textAlign: 'left' }}>
                    <strong>Успешно:</strong> {count} строк обработано.
                </div>
            );
        }

        const headers = Object.keys(result[0]);
        return (
            <div style={{ marginTop: '15px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'black', backgroundColor: 'white' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            {headers.map(h => <th key={h} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                {headers.map(h => <td key={h} style={{ border: '1px solid #ddd', padding: '8px' }}>{String(row[h])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p style={{marginTop: '10px', color: '#888'}}>Строк найдено: {result.length}</p>
            </div>
        );
    } else if (Array.isArray(result) && result.length === 0) {
        return (
            <div style={{ padding: '10px', backgroundColor: '#ffeb3b', color: 'black', borderRadius: '4px', marginTop: '15px', textAlign: 'left' }}>
                <strong>Внимание:</strong> Запрос выполнен, но не найдено ни одной строки.
            </div>
        );
    } else {
        let count = 0;
        if (typeof result === 'number') {
            count = result;
        } else if (typeof result === 'object' && result !== null) {
            count = result.affectedRows || result.count || 0;
        }
        
        return (
            <div style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '4px', marginTop: '15px', textAlign: 'left' }}>
                <strong>Успешно:</strong> {count} строк обработано.
            </div>
        );
    }
}


export default function EndpointConstructor({ token }) {
    // Редактируемый Endpoint
    const [id, setId] = useState(null); // null для создания, ID для редактирования
    const [endpoint, setEndpoint] = useState(''); 
    const [method, setMethod] = useState('GET');
    const [description, setDescription] = useState('');
    const [sql, setSql] = useState('SELECT id, path, method FROM AdminEndpoint;');
    
    // Состояние компонента
    const [response, setResponse] = useState(null); // Результат выполнения SQL теста
    const [loadingSql, setLoadingSql] = useState(false); // Загрузка SQL теста
    const [loadingSave, setLoadingSave] = useState(false); // Загрузка сохранения
    const [message, setMessage] = useState(null); // Сообщение о сохранении/обновлении/удалении
    
    // Список существующих Endpoint'ов
    const [savedEndpoints, setSavedEndpoints] = useState([]);


    // --- Загрузка и управление Endpoint'ами ---

    const loadEndpoints = async () => {
        const { ok, data } = await apiGetAdminEndpoints(token);
        if (ok && data.result) {
            setSavedEndpoints(data.result);
        } else {
            console.error('Ошибка загрузки Endpoint\'ов:', data.message);
        }
    };

    useEffect(() => {
        // Загружаем список при монтировании
        loadEndpoints();
    }, [token]);


    // Очистка формы (для создания нового)
    const resetForm = () => {
        setId(null);
        setEndpoint('');
        setMethod('GET');
        setDescription('');
        setSql('SELECT id, path, method FROM AdminEndpoint;');
        setMessage(null);
        setResponse(null);
    };

    // Загрузка данных для редактирования
    const handleEdit = (ep) => {
        setId(ep.id);
        setEndpoint(ep.path);
        setMethod(ep.method);
        setDescription(ep.description || '');
        setSql(ep.sqlQuery);
        setMessage(null);
        setResponse(null);
    };

    // Удаление Endpoint'а
    const handleDelete = async (epId) => {
        if (!window.confirm(`Вы уверены, что хотите удалить Endpoint ID ${epId}?`)) return;
        
        const { ok, data } = await apiDeleteAdminEndpoint(epId, token);
        if (ok) {
            setMessage({ type: 'success', text: data.message });
            loadEndpoints();
            if (id === epId) resetForm(); // Сбрасываем форму, если удалили редактируемый
        } else {
            setMessage({ type: 'error', text: data.message });
        }
    };


    // --- Выполнение SQL-теста ---

    const handleExecuteSql = async () => {
        setLoadingSql(true);
        setResponse(null);
        
        const result = await apiExecSql(sql, token);
        setResponse(result);
        setLoadingSql(false);
    };


    // --- Создание/Обновление (кнопка Save) ---

    const handleSave = async () => {
        if (!endpoint || !method || !sql) {
            setMessage({ type: 'error', text: 'Путь, метод и SQL-запрос обязательны.' });
            return;
        }

        setLoadingSave(true);
        setMessage(null);

        const payload = { 
            path: endpoint, 
            method, 
            description, 
            sqlQuery: sql 
        };
        
        let result;
        if (id) {
            // Обновление
            result = await apiUpdateAdminEndpoint(id, payload, token);
        } else {
            // Создание
            result = await apiCreateAdminEndpoint(payload, token);
        }

        if (result.ok) {
            setMessage({ type: 'success', text: result.data.message });
            loadEndpoints(); // Обновляем список
            if (!id) setId(result.data.result.id); // Устанавливаем ID, если это было создание
        } else {
            setMessage({ type: 'error', text: result.data.message });
        }

        setLoadingSave(false);
    };

    const isEditing = id !== null;

    return (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 20, maxWidth: 1200, margin: '20px auto', textAlign: 'left' }}>
            
            {/* --- Левая колонка: Конструктор --- */}
            <div className="card">
                <h3 style={{textAlign: 'center'}}>{isEditing ? `Редактирование Endpoint ID ${id}` : 'Создание нового Endpoint'}</h3>
                
                {/* Сообщение об операции */}
                {message && (
                    <div style={{ padding: '10px', backgroundColor: message.type === 'success' ? '#4CAF50' : '#f44336', color: 'white', borderRadius: '4px', marginBottom: '15px' }}>
                        {message.text}
                    </div>
                )}

                {/* --- Конструктор Endpoint --- */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 15, alignItems: 'center' }}>
                    
                    <label>
                        Тип:
                        <select value={method} onChange={e => setMethod(e.target.value)} style={{ marginLeft: 5 }}>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </label>
                    
                    <label style={{ flexGrow: 1 }}>
                        Endpoint:
                        <input 
                            type="text" 
                            value={endpoint} 
                            onChange={e => setEndpoint(e.target.value)} 
                            style={{ width: '100%', marginLeft: 5 }}
                            placeholder="/api/custom/my-data"
                        />
                    </label>

                    {/* Кнопка Save/Update */}
                    <button 
                        onClick={handleSave} 
                        disabled={loadingSave}
                        style={{ backgroundColor: loadingSave ? '#666' : '#007bff', color: 'white', height: '36px', alignSelf: 'flex-end' }}
                    >
                        {loadingSave ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Сохранить')}
                    </button>
                    
                    {isEditing && (
                        <button 
                            onClick={resetForm}
                            style={{ backgroundColor: '#ff9800', color: 'white', height: '36px', alignSelf: 'flex-end' }}
                        >
                            + Новый
                        </button>
                    )}
                </div>
                
                <label style={{ display: 'block', marginBottom: 15 }}>
                    Description:
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={2} 
                        style={{ width: '100%', marginTop: 5 }}
                        placeholder="Краткое описание назначения этого Endpoint'а"
                    />
                </label>
                
                <hr/>
                
                {/* --- SQL Редактор и Тест --- */}
                <h4>SQL Редактор</h4>
                <textarea 
                    value={sql} 
                    onChange={e => setSql(e.target.value)} 
                    rows={10} 
                    style={{ width: '100%', fontFamily: 'monospace', padding: 10, boxSizing: 'border-box' }}
                    placeholder="Например: SELECT * FROM User;"
                />
                
                <button 
                    onClick={handleExecuteSql} 
                    disabled={loadingSql}
                    style={{ marginTop: 10, backgroundColor: loadingSql ? '#666' : '#2196f3', color: 'white' }}
                >
                    {loadingSql ? 'Выполнение...' : 'Тест (Выполнить SQL)'}
                </button>
                
                <SqlResultDisplay response={response} />
            </div>

            {/* --- Правая колонка: Список сохраненных Endpoint'ов --- */}
            <div className="card">
                <h3>Сохраненные Endpoint'ы</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {savedEndpoints.length === 0 ? (
                        <p>Нет сохраненных Endpoint'ов.</p>
                    ) : (
                        savedEndpoints.map(ep => (
                            <li 
                                key={ep.id} 
                                style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '10px', 
                                    marginBottom: '8px', 
                                    cursor: 'pointer',
                                    backgroundColor: id === ep.id ? '#444' : 'inherit',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div onClick={() => handleEdit(ep)} style={{flexGrow: 1}}>
                                    <span style={{ fontWeight: 'bold', color: ep.method === 'GET' ? '#4CAF50' : '#ff9800' }}>{ep.method}</span> 
                                    : <code>{ep.path}</code>
                                    <p style={{fontSize: '0.8em', margin: '0', color: '#888'}}>{ep.description || 'Нет описания'}</p>
                                </div>
                                <div style={{marginLeft: 10}}>
                                    <button onClick={() => handleEdit(ep)} style={{ marginRight: '5px', background: '#2196f3', padding: '5px 8px' }}>
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(ep.id)} style={{ background: '#f44336', padding: '5px 8px' }}>
                                        ❌
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}