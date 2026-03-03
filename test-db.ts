import { db } from './db/db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    try {
        console.log('Testing DB connection and users table...');
        const result = await db.select().from(users).limit(1);
        console.log('Success! Found', result.length, 'users');
        if (result.length > 0) {
            console.log('Sample user tier:', result[0].tier);
        }
    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        process.exit(0);
    }
}

test();
