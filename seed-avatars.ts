import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import { avatars } from './db/schema';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(sql);

async function seed() {
    console.log('Seeding avatars...');
    const defaultAvatars = [
        { id: 'av_boy1', name: 'Thambi', description: 'A smart young boy', price: 0, imageUrl: '👦', isPremiumOnly: false },
        { id: 'av_girl1', name: 'Paapa', description: 'A clever young girl', price: 0, imageUrl: '👧', isPremiumOnly: false },
        { id: 'av_cat', name: 'Poonai', description: 'A curious cat', price: 50, imageUrl: '🐱', isPremiumOnly: false },
        { id: 'av_dog', name: 'Naay', description: 'A loyal dog', price: 50, imageUrl: '🐶', isPremiumOnly: false },
        { id: 'av_rabbit', name: 'Muyal', description: 'A fast rabbit', price: 100, imageUrl: '🐰', isPremiumOnly: false },
        { id: 'av_lion', name: 'Singam', description: 'King of the jungle', price: 200, imageUrl: '🦁', isPremiumOnly: false },
        { id: 'av_tiger', name: 'Puli', description: 'A fierce tiger', price: 250, imageUrl: '🐯', isPremiumOnly: false },
        { id: 'av_super', name: 'Super Hero', description: 'A magical hero', price: 500, imageUrl: '🦸', isPremiumOnly: true },
        { id: 'av_king', name: 'Mannan', description: 'An ancient king', price: 1000, imageUrl: '👑', isPremiumOnly: true },
    ];

    for (const av of defaultAvatars) {
        await db.insert(avatars).values(av).onConflictDoNothing();
    }
    console.log('Seeding complete!');
    process.exit(0);
}

seed();
