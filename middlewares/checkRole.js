module.exports = (...allowedRoles) => {
    return (req, res, next) => {
      const role = req.admin?.role;
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    };
  };
  