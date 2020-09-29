const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.header("sudo-auth");

  if (!token) {
    return res
      .status(403)
      .json({ errors: [{ msg: "forbidden, no token provided" }] });
  }

  try {
    const decoded = jwt.verify(token, process.env.secretToken);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ errors: [{ msg: "Invalid token provided" }] });
  }
};
