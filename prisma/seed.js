import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // finding exixting email
  const targetEmail = process.env.TEST_USER_EMAIL; 

  const user = await prisma.user.findUnique({
    where: { 
        email: targetEmail.toLowerCase().trim() 
    }
  });

  if (!user) {
      console.error('Please make sure you have registered this user first.');
      process.exit(1);
  }

  console.log(`Found user , Generating transactions...`);

  const TOTAL_RECORDS = 50000; 
  const BATCH_SIZE = 5000;     

  const categories = ['Food', 'Rent', 'Salary', 'Entertainment', 'Utilities', 'Transport'];
  const types = ['INCOME', 'EXPENSE'];

  // batch update
  for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
    const batch = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      batch.push({
        userId: user.id, 
        amount: faker.finance.amount({ min: 10, max: 5000, dec: 2 }),
        type: faker.helpers.arrayElement(types),
        category: faker.helpers.arrayElement(categories),
        date: faker.date.past({ years: 2 }), 
        notes: faker.lorem.sentence()
      });
    }

    // bulk insert
    await prisma.transaction.createMany({
      data: batch
    });

    console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });