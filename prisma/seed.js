import
{
    PrismaClient
}
from '@prisma/client';
import
{
    PrismaLibSQL
}
from '@prisma/adapter-libsql';

const urlenv = process.env.SECRET_TURSO_DATABASE_URL;
const authTokenEnv = process.env.SECRET_TURSO_AUTH_TOKEN;

if (!urlenv || !authTokenEnv)
{
    throw new Error('Missing Turso database configuration');
}

const adapter = new PrismaLibSQL(
{
    url: urlenv,
    authToken: authTokenEnv
});
const prisma = new PrismaClient(
{
    adapter
});

export
{
    prisma
};

async function main()
{
    console.log('🌱 Starting seed...');

    // Create a test family
    const family = await prisma.family.upsert(
    {
        where:
        {
            id: 1
        },
        update:
        {},
        create:
        {
            name: 'Test Family',
        },
    });

    console.log('✅ Created family:', family);

    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log(`👥 Current user count: ${userCount}`);

    if (userCount > 0)
    {
        // Update the first user to belong to the family
        const firstUser = await prisma.user.findFirst();
        if (firstUser && !firstUser.familyId)
        {
            await prisma.user.update(
            {
                where:
                {
                    id: firstUser.id
                },
                data:
                {
                    familyId: family.id,
                    role: 'Admin'
                }
            });
            console.log('✅ Updated user to belong to family');
        }
    }

    // Create sample accounts
    const accounts = await Promise.all([
        prisma.account.upsert(
        {
            where:
            {
                id: 1
            },
            update:
            {},
            create:
            {
                name: 'Main Checking',
                accountType: 'Checking',
                balance: 1500.00,
                color: '#10B981',
                familyId: family.id,
            },
        }),
        prisma.account.upsert(
        {
            where:
            {
                id: 2
            },
            update:
            {},
            create:
            {
                name: 'Savings Account',
                accountType: 'Savings',
                balance: 5000.00,
                color: '#3B82F6',
                familyId: family.id,
            },
        }),
        prisma.account.upsert(
        {
            where:
            {
                id: 3
            },
            update:
            {},
            create:
            {
                name: 'Credit Card',
                accountType: 'CreditCard',
                balance: -250.00,
                color: '#EF4444',
                familyId: family.id,
            },
        }),
    ]);

    console.log('✅ Created accounts:', accounts.length);

    // Create sample categories
    const categories = await Promise.all([
        prisma.category.upsert(
        {
            where:
            {
                id: 1
            },
            update:
            {},
            create:
            {
                name: 'Food & Dining',
                color: '#F59E0B',
                familyId: family.id,
            },
        }),
        prisma.category.upsert(
        {
            where:
            {
                id: 2
            },
            update:
            {},
            create:
            {
                name: 'Transportation',
                color: '#8B5CF6',
                familyId: family.id,
            },
        }),
        prisma.category.upsert(
        {
            where:
            {
                id: 3
            },
            update:
            {},
            create:
            {
                name: 'Entertainment',
                color: '#EC4899',
                familyId: family.id,
            },
        }),
        prisma.category.upsert(
        {
            where:
            {
                id: 4
            },
            update:
            {},
            create:
            {
                name: 'Salary',
                color: '#10B981',
                familyId: family.id,
            },
        }),
        prisma.category.upsert(
        {
            where:
            {
                id: 5
            },
            update:
            {},
            create:
            {
                name: 'Utilities',
                color: '#6B7280',
                familyId: family.id,
            },
        }),
    ]);

    console.log('✅ Created categories:', categories.length);

    // Create sample tags
    const tags = await Promise.all([
        prisma.tag.upsert(
        {
            where:
            {
                id: 1
            },
            update:
            {},
            create:
            {
                name: 'recurring',
                color: '#3B82F6',
                familyId: family.id,
            },
        }),
        prisma.tag.upsert(
        {
            where:
            {
                id: 2
            },
            update:
            {},
            create:
            {
                name: 'important',
                color: '#EF4444',
                familyId: family.id,
            },
        }),
        prisma.tag.upsert(
        {
            where:
            {
                id: 3
            },
            update:
            {},
            create:
            {
                name: 'business',
                color: '#10B981',
                familyId: family.id,
            },
        }),
    ]);

    console.log('✅ Created tags:', tags.length);

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) =>
    {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () =>
    {
        await prisma.$disconnect();
    });