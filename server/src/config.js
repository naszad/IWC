require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().nonempty(),
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

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  bcrypt: {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  },
}; 