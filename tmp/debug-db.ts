import { db } from './db/db';
import { users, childProfiles } from './db/schema';
import { eq } from 'drizzle-orm';

async function debug() {
    const userEmail = 'anu.ganesan@gmail.com';
    console.log(`Checking user: ${userEmail}`);

    const [user] = await db.select().from(users).where(eq(users.email, userEmail));
    if (!user) {
        console.log('User not found!');
        process.exit(0);
    }

    console.log('User found:', {
        id: user.id,
        name: user.name,
        tier: user.tier,
        coins: user.coins,
        region: user.region,
        createdAt: user.createdAt
    });

    const profiles = await db.select().from(childProfiles).where(eq(childProfiles.parentUserId, user.id));
    console.log(`Found ${profiles.length} child profiles:`);
    profiles.forEach(p => {
        console.log(`- ${p.nickname} (ID: ${p.id}, Region: ${p.region}, Coins: ${p.coins}, Created: ${p.createdAt})`);
    });

    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});
