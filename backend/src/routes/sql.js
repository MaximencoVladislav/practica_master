const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Список команд, которые строго запрещены для выполнения через редактор
const DANGEROUS_COMMANDS = [
    'drop table',
    'drop database',
    'truncate table',
    'alter table',
];

/**
 * Маршрут для выполнения произвольных SQL-запросов (только для ADMIN).
 */
router.post('/execute', auth, async (req, res) => {
  // 1. Проверка роли (должен быть ADMIN)
  if (req.user.roleName !== 'ADMIN') {
    return res.status(403).json({ message: 'Доступ к редактору SQL только для администраторов.' });
  }

  const { sql } = req.body; 
  
  if (!sql) {
    return res.status(400).json({ message: 'SQL-запрос не может быть пустым.' });
  }
  
  const trimmedSql = sql.trim();
  const lowerCaseSql = trimmedSql.toLowerCase();

  // 2. Базовая проверка безопасности
  const isDangerous = DANGEROUS_COMMANDS.some(cmd => lowerCaseSql.startsWith(cmd));
  if (isDangerous) {
     return res.status(403).json({ success: false, message: `Запрещена команда: ${lowerCaseSql.split(' ')[0]}.` });
  }

  try {
    let result;
    
    // 3. Выполнение SELECT-запросов
    if (lowerCaseSql.startsWith('select')) {
      result = await prisma.$queryRawUnsafe(trimmedSql);
      
      return res.json({ 
        success: true, 
        type: 'select',
        message: `Запрос SELECT выполнен. Получено ${result.length} строк.`, 
        data: result 
      });
    } 
    
    // 4. Выполнение DML-запросов (INSERT, UPDATE, DELETE) и других
    else {
      const affectedRows = await prisma.$executeRawUnsafe(trimmedSql);
      
      return res.json({ 
        success: true, 
        type: 'dml',
        message: `Запрос выполнен успешно. Затронуто ${affectedRows} записей.`, 
        affectedRows: affectedRows 
      });
    }
    
  } catch (error) {
    console.error("SQL Execution Error:", error);
    res.status(400).json({ 
        success: false, 
        message: 'Ошибка выполнения SQL-запроса', 
        error: error.message 
    });
  }
});

module.exports = router;