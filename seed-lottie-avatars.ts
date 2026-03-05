import { db } from './db/db';
import { avatars } from './db/schema';

async function seedLottie() {
    console.log('🧹 Clearing old avatars...');
    await db.delete(avatars);

    console.log('🚀 Seeding High-Quality Animated Avatars...');

    const characters = [
        { name: 'Arun', price: 200, emoji: '🧘', isPremium: false, isDefault: false },
        { name: 'StickMan', price: 500, emoji: '🏃', isPremium: true },
        { name: 'StickGirl', price: 500, emoji: '🏃‍♀️', isPremium: true },
        { name: 'Parrot', price: 200, emoji: '🦜', isPremium: false },
        { name: 'Banana', price: 0, emoji: '🍌', isPremium: false, isDefault: true },
        { name: 'Nila', price: 500, emoji: '👩', isPremium: true },
    ];

    const lottieAvatars = characters.map(char => ({
        id: char.isDefault ? 'default' : `lottie_${char.name.toLowerCase()}`,
        name: char.name,
        description: char.isDefault
            ? `Your starter animated avatar, ${char.name}!`
            : `Premium animated ${char.name} avatar with full expressions!`,
        price: char.price,
        imageUrl: char.emoji,
        thumbnailUrl: `/assets/avatars/thumbnails/${char.name.toLowerCase()}.png`,
        type: 'lottie' as const,
        isPremiumOnly: char.isPremium,
        metadata: {
            idle: `/assets/lottie/avatars/${char.name}/Idle.lottie`,
            happy: `/assets/lottie/avatars/${char.name}/Happy.lottie`,
            excited: `/assets/lottie/avatars/${char.name}/Happy.lottie`,
            sad: `/assets/lottie/avatars/${char.name}/Sad.lottie`,
            thinking: `/assets/lottie/avatars/${char.name}/Thinking.lottie`
        }
    }));

    for (const av of lottieAvatars) {
        await db.insert(avatars).values(av);
        console.log(`✅ Added ${av.name}`);
    }

    console.log('✨ Default avatar updated to Banana!');
    process.exit(0);
}

seedLottie().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
