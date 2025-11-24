const express = require('express');
const prisma = require('../prisma');
const auth = require('..//middleware/auth');

const router = express.Router();

// Middleware для проверки роли ADMIN
const isAdmin = (req, res, next) => {
    if (req.user.roleName !== 'ADMIN') {
        return res.status(403).json({ message: 'Доступ только для администраторов.' });
    }
    next();
};

// Получить все роли
router.get('/', auth, isAdmin, async (req, res) => {
    const roles = await prisma.role.findMany();
    res.json(roles);
});

// Создать новую роль
router.post('/', auth, isAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Имя роли обязательно.' });
    }
    const normalizedName = name.toUpperCase();

    try {
        const newRole = await prisma.role.create({
            data: { name: normalizedName }
        });
        res.status(201).json(newRole);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint failed
            return res.status(400).json({ message: `Роль с именем ${normalizedName} уже существует.` });
        }
        res.status(500).json({ message: 'Ошибка создания роли.' });
    }
});

// Удалить роль
router.delete('/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const role = await prisma.role.findUnique({ where: { id: parseInt(id) } });
        if (!role) {
            return res.status(404).json({ message: 'Роль не найдена.' });
        }
        // Защита от удаления стандартных ролей
        if (role.name === 'ADMIN' || role.name === 'USER') {
            return res.status(403).json({ message: 'Нельзя удалять стандартные роли ADMIN и USER.' });
        }

        // Проверка, что нет пользователей с этой ролью
        const usersInRoleCount = await prisma.user.count({
            where: { roleName: role.name }
        });
        if (usersInRoleCount > 0) {
             return res.status(400).json({ message: `Нельзя удалить роль "${role.name}", так как она назначена ${usersInRoleCount} пользователям.` });
        }
        
        await prisma.role.delete({ where: { id: parseInt(id) } });
        res.json({ message: `Роль ${role.name} успешно удалена.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка удаления роли.' });
    }
});

module.exports = router;