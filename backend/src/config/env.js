import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '1236', 10),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'mental_health_assistant',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'MySecretKeyForJWT2025!@#$%^&*()_+SecureKeyHere',
    expiration: parseInt(process.env.JWT_EXPIRATION || '86400000', 10),
    issuer: process.env.JWT_ISSUER || 'mental-health-assistant',
  },

  llm: {
    baseURL: process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1',
    apiKey: process.env.LLM_API_KEY || 'you-key',
    model: process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-V3',
  },

  uploadDir: process.env.UPLOAD_DIR || 'public',
};

// 公开路径白名单（与原 SecurityConfig 一致）
export const PUBLIC_PATHS = [
  '/',
  '/api/test',
  '/api/user/login',
  '/api/user/add',
];
