import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SERVICES = [
  { name: 'Aplicação de Gel do Zero', priceCents: 14000, durationMin: 120 },
  { name: 'Manutenção em Gel', priceCents: 10000, durationMin: 90 },
  { name: 'Cutilagem e Esmaltação', priceCents: 5000, durationMin: 45 },
];

async function main() {
  const salon = await prisma.salon.upsert({
    where: { slug: 'amanda-mendes' },
    update: { logoUrl: '/assets/logo-amanda-mendes-horizontal.png' },
    create: {
      id: 'default-salon',
      name: 'Amanda Mendes Studio',
      slug: 'amanda-mendes',
      logoUrl: '/assets/logo-amanda-mendes-horizontal.png',
    },
  });

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@example.com';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'changeme123';
  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      name: 'Amanda Mendes',
      salonId: salon.id,
    },
  });

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { salonId_name: { salonId: salon.id, name: service.name } },
      update: {},
      create: { ...service, salonId: salon.id },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
