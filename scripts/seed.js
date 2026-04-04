import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Database Seeding (Transactions Only)...');

    // Read from env
    const targetEmail = process.env.TEST_USER_EMAIL; 
    const targetOrgId = process.env.TEST_ORG_ID; 

    // Fetch ALL matching emails
    const matchingUsers = await prisma.user.findMany({
        where: { 
            email: targetEmail.toLowerCase().trim(),
            deletedAt: null
        }
    });

    if (matchingUsers.length === 0) {
        console.error(`User ${targetEmail} not found. Please register this user via the API first.`);
        process.exit(1);
    }

    if (matchingUsers.length > 1 && !targetOrgId) {
        console.error(`AMBIGUITY ERROR: The email ${targetEmail} exists in ${matchingUsers.length} different Organizations.`);
        console.error(`Please add TEST_ORG_ID="your-org-uuid" to your .env file to specify which tenant to seed.`);
        process.exit(1);
    }

    const user = targetOrgId 
        ? matchingUsers.find(u => u.orgId === targetOrgId)
        : matchingUsers[0];

    if (!user || !user.orgId) {
        console.error(`User ${targetEmail} not found or missing orgId.`);
        process.exit(1);
    }

    console.log(`Found target user: ${user.name}`);
    console.log(`Seeding into Organization ID: ${user.orgId}`);
    console.log('Generating 5,000 transactions (Skipping Audit Logs)...');

    const TOTAL_RECORDS = 5000; 
    const BATCH_SIZE = 1000; 

    const categories = ['food', 'rent', 'salary', 'software', 'marketing', 'utilities', 'transport', 'legal'];
    const types = ['INCOME', 'EXPENSE'];

    for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
        const transactionBatch = [];

        for (let j = 0; j < BATCH_SIZE; j++) {
            transactionBatch.push({
                id: faker.string.uuid(),
                createdById: user.id, 
                orgId: user.orgId,   
                amount: parseFloat(faker.finance.amount({ min: 10, max: 5000, dec: 2 })),
                type: faker.helpers.arrayElement(types),
                category: faker.helpers.arrayElement(categories),
                date: faker.date.past({ years: 1 }), 
                notes: faker.lorem.sentence(),
                status: 'ACTIVE'
            });
        }

        // bulk insert
        await prisma.transaction.createMany({ 
            data: transactionBatch 
        });

        console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${transactionBatch.length} Transactions)`);
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