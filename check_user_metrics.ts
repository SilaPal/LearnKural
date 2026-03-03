
import { db } from './db/db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function checkUserData() {
    try {
        const user = await db.select().from(users).where(eq(users.email, 'sila.pal.team@gmail.com')).limit(1);
        console.log('User data:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error checking user data:', e);
        process.exit(1);
    }
}

checkUserData();
