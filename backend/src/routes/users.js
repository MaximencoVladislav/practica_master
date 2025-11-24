// backend/src/routes/users.js

const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Только для ADMIN (Получение списка пользователей)
router.get('/', auth, async (req, res) => {
  if (req.user.roleName !== 'ADMIN') { 
    return res.status(403).json({ message: 'Доступ только для администраторов' });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, roleName: true, createdAt: true } 
  });

  res.json(users);
});

// Роут для смены роли
router.patch('/:id/role', auth, async (req, res) => {
    if (req.user.roleName !== 'ADMIN') {
        return res.status(403).json({ message: 'Доступ только для администраторов' });
    }
    const { id } = req.params;
    const { role: newRoleName } = req.body; 

    if (id === req.user.id.toString()) {
        return res.status(403).json({ message: 'Вы не можете менять свою собственную роль.' });
    }
    
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { roleName: newRoleName }
        });
        res.json({ message: `Роль пользователя ${updatedUser.name} изменена на ${newRoleName}` });
    } catch (error) {
        if (error.code === 'P2003') {
             return res.status(400).json({ message: `Роль "${newRoleName}" не существует.` });
        }
        res.status(500).json({ message: 'Ошибка сервера при смене роли.' });
    }
});

module.exports = router;