import { pgTable, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: varchar('id').primaryKey(), // Generated like user_timestamp_rand
    email: varchar('email').notNull().unique(),
    name: varchar('name').notNull(),
    googleId: varchar('google_id').notNull().unique(),
    picture: varchar('picture'),
    tier: varchar('tier', { enum: ['free', 'paid'] }).default('free').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProgress = pgTable('user_progress', {
    userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    completedLetters: jsonb('completed_letters').default([]).notNull(), // string array
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
