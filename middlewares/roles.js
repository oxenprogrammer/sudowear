const ROLE = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role)
      return res.status(403).json({ errors: [{ msg: "ACCESS DENIED!!!" }] });
    next();
  };
};

module.exports = ROLE;
