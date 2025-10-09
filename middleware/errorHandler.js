const isProd = process.env.NODE_ENV === 'production';

module.exports = (err, req, res, next) => {
  // Log full error on server
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  const payload = { success: false, message };

  // Provide stack trace in non-production for easier debugging
  if (!isProd && err.stack) payload.stack = err.stack;

  res.status(status).json(payload);
};
