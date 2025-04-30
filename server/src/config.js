require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().default('postgres://dbuser:dbpass@db:5432/iwcdb'),
  JWT_SECRET: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().default('4h'),
  BCRYPT_SALT_ROUNDS: z.string().transform(val => parseInt(val, 10)).default('10'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('❌ Invalid environment variables:', result.error.format());
  process.exit(1);
}

const env = result.data;

const isTest = env.NODE_ENV === 'test';
const databaseUrl = isTest
  ? process.env.DATABASE_URL || 'postgres://testuser:testpass@test-db:5432/iwcdb_test'
  : env.DATABASE_URL;

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: databaseUrl,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  bcrypt: {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  },
}; 