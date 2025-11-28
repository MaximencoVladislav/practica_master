const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const hasPermission = require('../middleware/permission');
const router = express.Router();

router.post('/execute', auth, hasPermission('sql:execute'), async (req, res) => {
  try {
    const sql = req.body.sql.trim();
    if (sql.toLowerCase().startsWith('select')) {
      res.json({ type: 'select', data: await prisma.$queryRawUnsafe(sql) });
    } else {
      res.json({ type: 'dml', affected: await prisma.$executeRawUnsafe(sql) });
    }
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/test', auth, hasPermission('sql:test'), async (req, res) => {
  const role = await prisma.role.findUnique({ where: { name: req.body.roleName }, include: { permissions: { include: { permission: true } } } });
  res.json({ has: role.permissions.some(p => p.permission.name === req.body.permName) });
});

module.exports = router;