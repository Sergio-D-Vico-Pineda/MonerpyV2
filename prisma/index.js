// Db
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

const urlenv =
    import.meta.env.SECRET_TURSO_DATABASE_URL || process.env.SECRET_TURSO_DATABASE_URL;
const authTokenEnv =
    import.meta.env.SECRET_TURSO_AUTH_TOKEN || process.env.SECRET_TURSO_AUTH_TOKEN;

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