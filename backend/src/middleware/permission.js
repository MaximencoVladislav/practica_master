module.exports = (perm) => (req, res, next) => {
  const userPerms = req.user.permissions || [];
  if (userPerms.includes(perm) || userPerms.includes('role:manage')) return next();
  res.status(403).json({ message: `Требуется право: ${perm}` });
};