import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = (process.env.DATABASE_URL || '').replace(/^["']|["']$/g, '');

// Singleton pattern for Drizzle + Next.js to prevent "too many clients" errors
const globalForDb = global as unknown as { client: postgres.Sql | undefined };
const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle(client, { schema });
