const { PrismaClient } = require('@prisma/client');

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.DB_HOST && process.env.DB_USER) {
    const port = process.env.DB_PORT || 5432;
    databaseUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`;
}

const prismaConfig = databaseUrl ? {
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
} : {};

const prisma = new PrismaClient(prismaConfig);

module.exports = prisma;
