// ─── Role-Based Access Control Middleware ───
// Usage: authorizeRole(['Counselor', 'Admin'])
// Must be used AFTER authMiddleware (req.user must exist)
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied — not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied — requires one of: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = authorizeRole;
