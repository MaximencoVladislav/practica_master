const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Начало заполнения начальными ролями...');

  const defaultRoles = [
    { name: 'ADMIN' },
    { name: 'USER' },
  ];

  // Создаем или обновляем роли, чтобы они существовали
  for (const roleData of defaultRoles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`Создана или обновлена роль: ${roleData.name}`);
  }

  // Назначаем роль ADMIN первому найденному пользователю (если он есть)
  const firstUser = await prisma.user.findFirst();
  if (firstUser && firstUser.roleName !== 'ADMIN') {
      await prisma.user.update({
          where: { id: firstUser.id },
          data: { roleName: 'ADMIN' }
      });
      console.log(`Первому пользователю (${firstUser.email}) назначена роль ADMIN.`);
  }

  console.log('Заполнение начальными ролями завершено.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });