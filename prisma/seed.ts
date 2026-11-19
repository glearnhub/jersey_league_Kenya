import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('ADMIN_EMAIL and ADMIN_PASSWORD are not set in .env: no admin user was created.');
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name: 'Owner', password: hashedPassword },
    create: { email, name: 'Owner', password: hashedPassword },
  });
}

async function upsertCategory(name: string, parent: { id: number; slug: string } | null, sortOrder: number) {
  const slug = slugify((parent ? `${parent.slug}-` : '') + name);
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId: parent?.id ?? null, sortOrder },
    create: { slug, name, parentId: parent?.id ?? null, sortOrder, isActive: true },
  });
}

async function seedCategories() {
  const tree: Record<string, Record<string, string[]> | string[]> = {
    Football: {
      'English Premier League': ['Club Jerseys', 'Clearance Sale'],
      'Kenya Premier League': ['Club Jerseys'],
      Kenya: ['Club Jerseys', 'National Team Jerseys'],
      'World Football': [
        'Club Jerseys',
        'National Teams Jerseys',
        'Kids Jerseys',
        'Retro Jerseys',
        'Special Edition Jerseys',
        'Tracksuits & Hoodies',
      ],
    },
    Rugby: [],
    'Formula One': [],
    Accessories: {
      'Boots & Balls': [],
      Flags: [],
      Socks: [],
    },
  };

  let sportOrder = 0;
  for (const [sport, competitions] of Object.entries(tree)) {
    const sportCat = await upsertCategory(sport, null, sportOrder++);
    let compOrder = 0;
    if (Array.isArray(competitions)) {
      for (const comp of competitions) {
        await upsertCategory(comp, sportCat, compOrder++);
      }
    } else {
      for (const [compName, collections] of Object.entries(competitions)) {
        const compCat = await upsertCategory(compName, sportCat, compOrder++);
        let colOrder = 0;
        for (const colName of collections) {
          await upsertCategory(colName, compCat, colOrder++);
        }
      }
    }
  }
}

async function seedDeliveryZones() {
  const zones: Array<[string, string, number, number | null, string, string | null]> = [
    ['Nairobi CBD', 'standard', 100, 10000, 'Same day', null],
    ['Nairobi (outside the CBD)', 'standard', 150, 10000, 'Same day', null],
    ['Other areas', 'standard', 300, 10000, '1-2 business days', null],
    ['Nairobi express (nearby)', 'express', 250, null, 'Same day', 'Order early in the day to guarantee same-day dispatch.'],
    ['Nairobi express (far)', 'express', 500, null, 'Same day', 'Order early in the day to guarantee same-day dispatch.'],
    ['Pick up from our shop', 'pickup', 0, null, 'Ready the same day', 'Shop address to be added in the admin.'],
  ];

  for (let i = 0; i < zones.length; i++) {
    const [name, method, fee, freeOver, estimate, note] = zones[i];
    const existing = await prisma.deliveryZone.findFirst({ where: { name } });
    if (!existing) {
      await prisma.deliveryZone.create({
        data: { name, method, fee, freeOver, estimate, note, sortOrder: i, isActive: true },
      });
    }
  }
}

async function seedDemoProducts() {
  const getCatId = async (slug: string) => (await prisma.category.findUnique({ where: { slug } }))?.id ?? null;

  const epl = await getCatId('football-english-premier-league-club-jerseys');
  const world = await getCatId('football-world-football-club-jerseys');
  const kids = await getCatId('football-world-football-kids-jerseys');
  const kpl = await getCatId('football-kenya-premier-league-club-jerseys');
  const kenya = await getCatId('football-kenya-club-jerseys');
  const national = await getCatId('football-kenya-national-team-jerseys');

  const demo: Array<[string, string, string, string, number, number | null, string | null]> = [
    ['Arsenal Home 26/27 Fan Jersey', 'Arsenal', 'home', 'fan', 1300, epl, 'new'],
    ['Arsenal Home 26/27 Player Jersey', 'Arsenal', 'home', 'player', 1600, epl, null],
    ['Liverpool Away 26/27 Fan Jersey', 'Liverpool', 'away', 'fan', 1300, epl, 'best_seller'],
    ['Chelsea 3rd 26/27 Player Jersey', 'Chelsea', 'third', 'player', 1600, epl, null],
    ['Manchester United Home 26/27 Fan Jersey', 'Manchester United', 'home', 'fan', 1300, epl, 'new'],
    ['Real Madrid Home 26/27 Fan Jersey', 'Real Madrid', 'home', 'fan', 1300, world, 'best_seller'],
    ['Barcelona Away 26/27 Player Jersey', 'Barcelona', 'away', 'player', 1600, world, null],
    ['Bayern Home 26/27 Fan Jersey', 'Bayern', 'home', 'fan', 1300, world, null],
    ['Arsenal Away 26/27 Kids Jersey', 'Arsenal', 'away', 'kids', 1300, kids, null],
    ['Gor Mahia Home 26/27 Fan Jersey', 'Gor Mahia', 'home', 'fan', 1300, kpl, 'new'],
    ['AFC Leopards Home 26/27 Fan Jersey', 'AFC Leopards', 'home', 'fan', 1300, kpl, null],
    ['Nairobi City Stars Home 26/27 Fan Jersey', 'Nairobi City Stars', 'home', 'fan', 1300, kenya, null],
    ['Harambee Stars Home 26/27 Fan Jersey', 'Kenya', 'home', 'fan', 1300, national, 'new'],
    ['Manchester United Away 25/26 Fan Jersey', 'Manchester United', 'away', 'fan', 500, epl, 'clearance'],
  ];

  const adultSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL'];
  const kidsSizes = ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];

  for (let n = 0; n < demo.length; n++) {
    const [name, team, kit, version, price, categoryId, badge] = demo[n];
    const slug = slugify(name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        categoryId,
        team,
        season: name.includes('25/26') ? '25/26' : '26/27',
        kit,
        version,
        price,
        badge,
        isFeatured: n < 6,
        isActive: true,
        allowsPrinting: true,
        allowsSleeveBadge: false,
        compareAtPrice: badge === 'clearance' ? 1300 : null,
        description: 'Demo product: replace it in the admin.',
        careNotes:
          'Do not wash in a washing machine.\nDo not iron the print.\nAvoid squeezing the jersey while washing.\nAlways dry inside out.',
      },
    });

    const sizes = version === 'kids' ? kidsSizes : adultSizes;
    for (const size of sizes) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size } },
        update: {},
        create: { productId: product.id, size, stock: 5, reserved: 0 },
      });
    }
  }
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedDeliveryZones();
  if (process.env.NODE_ENV !== 'production') {
    await seedDemoProducts();
  }
  console.log('Seeded database successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
