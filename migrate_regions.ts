import { db } from './db/db';
import { users } from './db/schema';
import { eq, or, sql } from 'drizzle-orm';

async function migrate() {
    console.log('Starting region migration...');
    
    // Middle East -> United Arab Emirates
    const middleEastResult = await db.update(users)
        .set({ region: 'United Arab Emirates' })
        .where(eq(users.region, 'Middle East'));
        
    // Europe -> United Kingdom (Best guess for legacy European users)
    const europeResult = await db.update(users)
        .set({ region: 'United Kingdom' })
        .where(eq(users.region, 'Europe'));
        
    // North America -> United States
    const naResult = await db.update(users)
        .set({ region: 'United States' })
        .where(eq(users.region, 'North America'));
        
    // Other -> Global
    const otherResult = await db.update(users)
        .set({ region: 'Global' })
        .where(eq(users.region, 'Other'));

    console.log('Migration complete!');
    process.exit(0);
}

migrate().catch(console.error);
