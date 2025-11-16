/**
 * Configuration globale des tests
 */

// Augmenter le timeout pour les tests
jest.setTimeout(30000);

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/devfest_studio_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!';
process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project';
process.env.STORAGE_BUCKET = 'test-bucket';
process.env.GEMINI_API_KEY = 'test-gemini-key';
