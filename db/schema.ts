import { pgTable, varchar, timestamp, jsonb, integer, boolean, primaryKey, foreignKey } from 'drizzle-orm/pg-core';

export const schools = pgTable('schools', {
    id: varchar('id').primaryKey(),
    name: varchar('name').notNull(),
    logo: varchar('logo'),
    banner: varchar('banner'),
    subscriptionStatus: varchar('subscription_status', { enum: ['active', 'expired', 'trial'] }).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
    id: varchar('id').primaryKey(), // Generated like user_timestamp_rand
    email: varchar('email').notNull().unique(),
    name: varchar('name').notNull(),
    googleId: varchar('google_id').notNull().unique(),
    picture: varchar('picture'),
    tier: varchar('tier', { enum: ['free', 'paid'] }).default('free').notNull(),
    coins: integer('coins').default(0).notNull(),
    activeAvatarId: varchar('active_avatar_id').default('default').notNull(),
    region: varchar('region').default('Global').notNull(),
    role: varchar('role', { enum: ['student', 'parent', 'teacher', 'school_admin', 'super_admin'] }).default('student').notNull(),
    schoolId: varchar('school_id'),
    parentId: varchar('parent_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        schoolReference: foreignKey({
            columns: [table.schoolId],
            foreignColumns: [schools.id]
        }),
        parentReference: foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id]
        })
    }
});

export const classrooms = pgTable('classrooms', {
    id: varchar('id').primaryKey(),
    schoolId: varchar('school_id').notNull(),
    name: varchar('name').notNull(),
    teacherId: varchar('teacher_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        schoolRef: foreignKey({
            columns: [table.schoolId],
            foreignColumns: [schools.id]
        }).onDelete('cascade'),
        teacherRef: foreignKey({
            columns: [table.teacherId],
            foreignColumns: [users.id]
        })
    }
});

export const classroomStudents = pgTable('classroom_students', {
    classroomId: varchar('classroom_id').notNull(),
    studentId: varchar('student_id').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.classroomId, table.studentId] }),
        classroomRef: foreignKey({
            columns: [table.classroomId],
            foreignColumns: [classrooms.id]
        }).onDelete('cascade'),
        studentRef: foreignKey({
            columns: [table.studentId],
            foreignColumns: [users.id]
        }).onDelete('cascade'),
    }
});

export const schoolInvites = pgTable('school_invites', {
    code: varchar('code').primaryKey(),
    schoolId: varchar('school_id').notNull(),
    classroomId: varchar('classroom_id'),
    role: varchar('role', { enum: ['student', 'teacher'] }).default('student').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        schoolRef: foreignKey({
            columns: [table.schoolId],
            foreignColumns: [schools.id]
        }).onDelete('cascade'),
        classroomRef: foreignKey({
            columns: [table.classroomId],
            foreignColumns: [classrooms.id]
        }).onDelete('cascade'),
    }
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
        pk: primaryKey({ columns: [t.userId, t.avatarId] })
    }
});
