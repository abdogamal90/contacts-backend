const isProd = process.env.NODE_ENV === 'production';

module.exports = (err, req, res, next) => {
  console.error(err);

  // Default error response
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    const value = err.keyValue ? err.keyValue[field] : 'this value';
    message = `A contact with ${field} "${value}" already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired. Please log in again.';
  }

  res.status(status).json({
    success: false,
    message: message,
  });
};
