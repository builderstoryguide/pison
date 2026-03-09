import prisma from './lib/prisma';

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            status: true,
            isTrashed: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            role: {
                select: { slug: true }
            }
        }
    });
    console.table(users.map(u => ({
        ...u,
        role: u.role?.slug
    })));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
