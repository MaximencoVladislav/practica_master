const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email и пароль обязательны' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });

  const count = await prisma.user.count(); 
  // ИСПРАВЛЕНО: Используем roleName. Первый пользователь будет ADMIN.
  const roleName = count === 0 ? 'ADMIN' : 'USER'; 

  const hashed = await bcrypt.hash(password, 10);

  try {
      const user = await prisma.user.create({
        // ИСПРАВЛЕНО: Использование roleName
        data: { email, password: hashed, name, roleName: roleName } 
      });

      res.json({
        message: 'Пользователь зарегистрирован',
        // ИСПРАВЛЕНО: Возвращаем roleName
        user: { id: user.id, email: user.email, roleName: user.roleName, name: user.name } 
      });
  } catch(error) {
      console.error(error);
      if (error.code === 'P2003') {
           return res.status(500).json({ message: 'Ошибка привязки роли. Проверьте, что роли ADMIN и USER существуют в базе данных.' });
      }
      return res.status(500).json({ message: 'Ошибка регистрации.' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // ИСПРАВЛЕНО: Добавляем roleName в select
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: { id: true, name: true, email: true, roleName: true, password: true }
  });
  
  if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Неверный email или пароль' });

  // ИСПРАВЛЕНО: Используем roleName в JWT payload
  const token = jwt.sign(
    { id: user.id, email: user.email, roleName: user.roleName },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Вход успешен',
    token,
    // ИСПРАВЛЕНО: Используем roleName в ответе
    user: { id: user.id, name: user.name, email: user.email, roleName: user.roleName } 
  });
});

// Текущий пользователь
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Нет токена' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); 
    
    // ИСПРАВЛЕНО: Добавляем roleName в select
    const user = await prisma.user.findUnique({ 
        where: { id: payload.id },
        select: { id: true, name: true, email: true, roleName: true }
    });
    
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    // ИСПРАВЛЕНО: Используем roleName в ответе
    res.json({ id: user.id, email: user.email, roleName: user.roleName, name: user.name });
  } catch(error) {
    res.status(401).json({ message: 'Неверный или истёкший токен' });
  }
});

module.exports = router;