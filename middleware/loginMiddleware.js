const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Preferred unified shape
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    // Backward compatibility during transition
    req.userId = decoded.id;
    req.role = decoded.role;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const rbac = (roles) => {
  return (req, res, next) => {
    const userRole = req.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { verifyToken, rbac };