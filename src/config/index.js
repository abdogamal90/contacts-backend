function loadConfig() {
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  // Railway / Atlas templates sometimes use DATABASE_URL or MONGODB_URI instead of MONGO_URL
  const mongoUrl = (
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
  const missing = [];
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!mongoUrl) {
    missing.push('MONGO_URL (or MONGODB_URI / DATABASE_URL)');
  }
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'In Railway: open the service that runs this Docker image → Variables → add them → click Apply / save, then Redeploy. ' +
        'Purple or pending rows are not live until applied. This image does not include .env.'
    );
  }

  const port = parseInt(process.env.PORT || '8000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const corsOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return { jwtSecret, mongoUrl, port, nodeEnv, corsOrigins };
}

module.exports = loadConfig();
