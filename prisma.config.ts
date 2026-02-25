import dotenv from 'dotenv';
import path from 'path';

// Load .env first, then .env.local (local overrides for dev)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
