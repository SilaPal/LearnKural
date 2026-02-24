import { pgTable, varchar, timestamp, jsonb, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: varchar('id').primaryKey(), // Generated like user_timestamp_rand
    email: varchar('email').notNull().unique(),
    name: varchar('name').notNull(),
    googleId: varchar('google_id').notNull().unique(),
    picture: varchar('picture'),
    tier: varchar('tier', { enum: ['free', 'paid'] }).default('free').notNull(),
    coins: integer('coins').default(0).notNull(),
    activeAvatarId: varchar('active_avatar_id').default('default').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProgress = pgTable('user_progress', {
    userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    completedLetters: jsonb('completed_letters').default([]).notNull(), // string array
    completedChapters: jsonb('completed_chapters').default([]).notNull(), // number array representing Quest nodes
    badges: jsonb('badges').default([]).notNull(), // { categoryId: string, earnedAt: number, viewed?: boolean } array
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userFavorites = pgTable('user_favorites', {
    userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    kuralIds: jsonb('kural_ids').default([]).notNull(), // number array
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
    email: varchar('email').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const avatars = pgTable('avatars', {
    id: varchar('id').primaryKey(),
    name: varchar('name').notNull(),
    description: varchar('description'),
    price: integer('price').default(0).notNull(),
    imageUrl: varchar('image_url').notNull(),
    isPremiumOnly: boolean('is_premium_only').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAvatars = pgTable('user_avatars', {
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    avatarId: varchar('avatar_id').references(() => avatars.id, { onDelete: 'cascade' }).notNull(),
    unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (t) => {
    return {
        pk: primaryKey(t.userId, t.avatarId)
    }
});
