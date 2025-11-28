// backend/src/routes/roles.js

const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const hasPermission = require('../middleware/permission');

const router = express.Router();


// --- Управление ролями (Role CRUD) ---

// 1. Получить список всех ролей с правами
router.get('/', auth, hasPermission('role:read'), async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        // Форматируем права для удобства фронтенда
        const formattedRoles = roles.map(role => ({
            ...role,
            permissions: role.permissions.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name,
                permissionId: rp.permissionId
            }))
        }));

        res.json(formattedRoles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Ошибка при получении списка ролей' });
    }
});

// 2. Создать новую роль
router.post('/', auth, hasPermission('role:manage'), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Имя роли обязательно' });

    try {
        const role = await prisma.role.create({ data: { name } });
        res.status(201).json(role);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: `Роль ${name} уже существует` });
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Ошибка при создании роли' });
    }
});

// 3. Удалить роль
router.delete('/:id', auth, hasPermission('role:manage'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Неверный ID роли' });

    try {
        const role = await prisma.role.findUnique({ where: { id } });
        if (role.name === 'ADMIN' || role.name === 'USER') {
            return res.status(403).json({ message: 'Нельзя удалить системную роль' });
        }
        await prisma.role.delete({ where: { id } });
        res.json({ message: 'Роль удалена' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Ошибка при удалении роли' });
    }
});


// --- Управление правами (Permissions) ---

// 1. Получить список всех прав
router.get('/list', auth, hasPermission('role:manage'), async (req, res) => {
    try {
        const perms = await prisma.permission.findMany({ orderBy: { id: 'asc' } });
        res.json(perms);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Ошибка при получении списка прав' });
    }
});

// 2. Добавить/удалить право у роли
router.post('/toggle_perm', auth, hasPermission('role:manage'), async (req, res) => {
    const { roleId, permissionId, enable } = req.body;
    if (typeof roleId !== 'number' || typeof permissionId !== 'number' || typeof enable !== 'boolean') {
        return res.status(400).json({ message: 'Неверные данные' });
    }

    try {
        if (enable) {
            await prisma.rolePermission.create({ data: { roleId, permissionId } });
            res.json({ message: 'Право добавлено' });
        } else {
            await prisma.rolePermission.delete({
                where: { roleId_permissionId: { roleId, permissionId } }
            });
            res.json({ message: 'Право удалено' });
        }
    } catch (error) {
        // P2002 - Unique constraint failed (право уже есть)
        if (enable && error.code === 'P2002') return res.json({ message: 'Право уже было добавлено' });
        console.error('Error toggling permission:', error);
        res.status(500).json({ message: 'Ошибка при изменении прав' });
    }
});

// 3. Проверить право (для теста на фронтенде)
router.post('/test_perm', auth, hasPermission('role:manage'), async (req, res) => {
    const { roleName, permName } = req.body;
    
    // Получаем права для указанной роли
    const role = await prisma.role.findUnique({
        where: { name: roleName },
        include: { permissions: { include: { permission: true } } }
    });

    // Проверяем, есть ли такое право у этой роли
    const has = role?.permissions?.some(rp => rp.permission.name === permName) || false;

    // ADMIN всегда имеет все права
    if (roleName === 'ADMIN') {
        return res.json({ has: true });
    }

    res.json({ has });
});


// --- SQL Редактор (для тестирования) ---

// Внимание: Этот роут используется для *теста* SQL-запросов и требует специального права.
router.post('/sql', auth, hasPermission('admin:sql_exec'), async (req, res) => {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ ok: false, message: 'SQL-запрос обязателен' });

    try {
        // Выполнение SQL-запроса через Prisma (raw query)
        const result = await prisma.$queryRawUnsafe(sql);
        res.json({ ok: true, result });
    } catch (error) {
        // Возвращаем ошибку SQL
        res.status(400).json({ ok: false, message: error.message });
    }
});


// --- Управление Admin Endpoint'ами (новые роуты) ---

// 1. Получить список всех Endpoint'ов
router.get('/endpoints', auth, hasPermission('admin:manage_endpoints'), async (req, res) => {
    try {
        const endpoints = await prisma.adminEndpoint.findMany({
            orderBy: { id: 'asc' }
        });
        res.json({ ok: true, result: endpoints });
    } catch (error) {
        console.error('Error fetching admin endpoints:', error);
        res.status(500).json({ ok: false, message: 'Ошибка при получении списка Endpoint\'ов' });
    }
});


// 2. Создать новый Endpoint
router.post('/endpoints', auth, hasPermission('admin:manage_endpoints'), async (req, res) => {
    const { path, method, description, sqlQuery } = req.body;
    
    if (!path || !method || !sqlQuery) {
        return res.status(400).json({ ok: false, message: 'Путь, метод и SQL-запрос обязательны.' });
    }

    try {
        const newEndpoint = await prisma.adminEndpoint.create({
            data: { path, method, description, sqlQuery }
        });
        res.status(201).json({ ok: true, message: 'Endpoint успешно создан', result: newEndpoint });
    } catch (error) {
        if (error.code === 'P2002') { 
            return res.status(400).json({ ok: false, message: `Endpoint с путем '${path}' уже существует.` });
        }
        console.error('Error creating admin endpoint:', error);
        res.status(500).json({ ok: false, message: 'Ошибка при создании Endpoint\'а' });
    }
});


// 3. Обновить существующий Endpoint
router.patch('/endpoints/:id', auth, hasPermission('admin:manage_endpoints'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { path, method, description, sqlQuery } = req.body;
    
    if (!id) {
        return res.status(400).json({ ok: false, message: 'ID обязателен для обновления.' });
    }
    
    try {
        const updatedEndpoint = await prisma.adminEndpoint.update({
            where: { id },
            data: { path, method, description, sqlQuery }
        });
        res.json({ ok: true, message: 'Endpoint успешно обновлен', result: updatedEndpoint });
    } catch (error) {
        if (error.code === 'P2025') { 
            return res.status(404).json({ ok: false, message: `Endpoint с ID ${id} не найден.` });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ ok: false, message: `Endpoint с путем '${path}' уже существует.` });
        }
        console.error('Error updating admin endpoint:', error);
        res.status(500).json({ ok: false, message: 'Ошибка при обновлении Endpoint\'а' });
    }
});


// 4. Удалить Endpoint
router.delete('/endpoints/:id', auth, hasPermission('admin:manage_endpoints'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (!id) {
        return res.status(400).json({ ok: false, message: 'ID обязателен для удаления.' });
    }
    
    try {
        await prisma.adminEndpoint.delete({
            where: { id },
        });
        res.json({ ok: true, message: `Endpoint ID ${id} успешно удален` });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ ok: false, message: `Endpoint с ID ${id} не найден.` });
        }
        console.error('Error deleting admin endpoint:', error);
        res.status(500).json({ ok: false, message: 'Ошибка при удалении Endpoint\'а' });
    }
});


module.exports = router;