import { db } from './db/db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const user = await db.select().from(users).where(eq(users.email, 'sila.pal.team@gmail.com'));
    console.log('PICTURE:', user[0]?.picture);
    process.exit(0);
}
main();
