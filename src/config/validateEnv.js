const REQUIRED_VARS = ['JWT_SECRET'];
const REQUIRED_IN_PRODUCTION_ONLY = ['MONGO_URI'];

const validateEnv = () => {
  const missing = [];

  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key] || !process.env[key].trim()) {
      missing.push(key);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    REQUIRED_IN_PRODUCTION_ONLY.forEach((key) => {
      if (!process.env[key] || !process.env[key].trim()) {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nCheck your .env file against .env.example and try again.');
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    console.warn(
      '⚠️  JWT_SECRET is shorter than 16 characters — use a longer, random value in production.'
    );
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    console.warn(
      '⚠️  CLIENT_URL is not set — Socket.IO CORS will fall back to "*" (allow all origins).'
    );
  }
};

module.exports = validateEnv;
