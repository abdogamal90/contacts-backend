function loadConfig() {
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const mongoUrl = (process.env.MONGO_URL || '').trim();
  const missing = [];
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (!mongoUrl) missing.push('MONGO_URL');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them on the Railway service that runs this app (Variables), then redeploy. ' +
        'If you use a Dockerfile, variables are injected at run time — they are not read from .env in the image.'
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
