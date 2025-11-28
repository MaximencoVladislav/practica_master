const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполнение БД...');

  // 1. Роли
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  const userRole = await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });

  // 2. Права
  const perms = ['user:read', 'user:update_role', 'role:manage', 'sql:execute', 'sql:test'];

  for (const pName of perms) {
    const perm = await prisma.permission.upsert({ where: { name: pName }, update: {}, create: { name: pName } });
    
    // Админу даем ВСЕ права
    await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id }
    });
  }

  // 3. Первый юзер - Админ
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
      await prisma.user.update({ where: { id: firstUser.id }, data: { roleName: 'ADMIN' } });
      console.log(`👑 ${firstUser.email} стал ADMIN`);
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());