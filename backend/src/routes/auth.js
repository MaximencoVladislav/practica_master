// backend/src/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const router = express.Router();

// Эта функция безопасно извлекает пользователя с его правами
// (Взято из вашего нового кода)
async function getUserWithPerms(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { 
        role: { 
            include: { 
                permissions: { 
                    include: { permission: true } 
                } 
            } 
        } 
    }
  });

  if (!user) return null;

  // Безопасное извлечение прав
  const permissions = user.role?.permissions?.map(rp => rp.permission.name) || [];
  
  // Создаем объект пользователя, удаляя password
  const { password, role, ...safeUser } = user;
  
  // roleName уже есть в safeUser, но мы можем его перепроверить
  const roleName = user.roleName || 'USER'; 
  
  return { 
      ...safeUser, 
      roleName: roleName, 
      permissions: permissions 
  };
}


// Регистрация
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: 'Email и пароль обязательны' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });

    const count = await prisma.user.count(); 
    // !!! Используем roleName в соответствии с новой схемой Prisma !!!
    const roleName = count === 0 ? 'ADMIN' : 'USER'; 

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, name, roleName } // Сохраняем roleName
    });

    // !!! ИСПРАВЛЕНИЕ: Возвращаем полный объект !!!
    const userWithPerms = await getUserWithPerms(user.email); 

    res.json({
      message: 'Пользователь зарегистрирован',
      user: userWithPerms
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Ошибка сервера при регистрации.' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try { 
    const rawUser = await prisma.user.findUnique({ where: { email } });
    
    if (!rawUser) 
      return res.status(400).json({ message: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, rawUser.password);
    if (!ok) 
      return res.status(400).json({ message: 'Неверный email или пароль' });

    // !!! ИСПРАВЛЕНИЕ: Получаем полный объект пользователя !!!
    const userWithPerms = await getUserWithPerms(rawUser.email);
    
    if (!userWithPerms)
        return res.status(400).json({ message: 'Ошибка при получении данных пользователя.' });

    // 3. Создание токена
    const token = jwt.sign(
      { 
          id: userWithPerms.id, 
          email: userWithPerms.email, 
          roleName: userWithPerms.roleName, 
          permissions: userWithPerms.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Успешный ответ
    res.json({
      message: 'Вход успешен',
      token,
      user: userWithPerms // <-- Полный объект
    });

  } catch (e) {
    console.error('Login processing error:', e);
    res.status(400).json({ message: 'Неверный email или пароль' }); 
  }
});


// Роут для получения данных пользователя по токену
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if(!token) return res.status(401).json({ message: 'Нет токена' });
  
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // !!! ИСПРАВЛЕНИЕ: Ищем по email из токена (более надежно) !!!
      const user = await getUserWithPerms(decoded.email); 
      
      if (!user) {
         return res.status(401).json({ message: 'Пользователь не найден' });
      }

      // Возвращаем полный объект
      res.json(user);

  } catch (e) {
      console.error('Auth /me error:', e);
      // Если токен невалиден или просрочен
      res.status(401).json({ message: 'Невалидный или просроченный токен' });
  }
});

module.exports = router;