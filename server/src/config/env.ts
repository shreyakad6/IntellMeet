import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to server/.env if present

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet',
  JWT_SECRET: process.env.JWT_SECRET || 'intellmeet_jwt_default_secret_key_change_in_prod_32',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'intellmeet_jwt_refresh_secret_key_change_in_prod_32',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Free-Tier AI Provider Settings (Google Gemini & Groq)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'whisper-large-v3-turbo',
  get isGeminiConfigured(): boolean {
    return !!this.GEMINI_API_KEY && this.GEMINI_API_KEY.trim().length > 0;
  },
  get isGroqConfigured(): boolean {
    return !!this.GROQ_API_KEY && this.GROQ_API_KEY.trim().length > 0;
  },

  // Legacy / Optional AI Settings
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  DEMO_MODE: process.env.DEMO_MODE === 'true',

  // Redis Settings
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',

  // Storage
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'cloudinary' | 's3',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',

  // Metrics
  PROMETHEUS_METRICS_ENABLED: process.env.PROMETHEUS_METRICS_ENABLED !== 'false',
  SENTRY_DSN: process.env.SENTRY_DSN || ''
};
