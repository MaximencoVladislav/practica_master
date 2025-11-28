// backend/src/routes/users.js

const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
// Предполагаем, что middleware/permission.js существует
const hasPermission = require('../middleware/permission'); 
const router = express.Router();

// GET /api/users
// Требуется право 'user:read' (или ADMIN через middleware)
router.get('/', auth, hasPermission('user:read'), async (req, res) => {
  // Выбираем только нужные поля, включая roleName
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, roleName: true, createdAt: true }
  });
  res.json(users);
});

// PATCH /api/users/:id/role
// Требуется право 'user:update_role' (или ADMIN через middleware)
router.patch('/:id/role', auth, hasPermission('user:update_role'), async (req, res) => {
  const userIdToUpdate = +req.params.id;
  // !!! ИСПРАВЛЕНИЕ: Ожидаем roleName в теле запроса (см. api.js) !!!
  const { roleName: newRoleName } = req.body; 

  if (!newRoleName) {
    return res.status(400).json({ message: 'Требуется roleName' });
  }

  // Запрет на смену своей собственной роли (ИСПРАВЛЕНИЕ ПРОБЛЕМЫ)
  if (userIdToUpdate === req.user.id) {
    return res.status(403).json({ message: 'Вы не можете менять свою собственную роль.' });
  }
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      // !!! КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Обновляем поле 'roleName' !!!
      data: { roleName: newRoleName } 
    });
    
    res.json({ 
      ok: true, 
      message: `Роль пользователя ${updatedUser.name} изменена на ${updatedUser.roleName}`,
      user: { id: updatedUser.id, roleName: updatedUser.roleName }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Ошибка сервера при смене роли. Возможно, неверное имя роли.' });
  }
});

module.exports = router;