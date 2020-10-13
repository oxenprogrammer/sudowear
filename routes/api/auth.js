const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("./../../models/User");
const auth = require("./../../middlewares/auth");
const ROLE = require("./../../middlewares/roles");
require("dotenv").config();

// @route    POST api/auth
// @desc     Auth route
// @access   Public

const checkEmail = check("email", "Please provide a valid email").isEmail();
const checkPhone = check(
  "phone",
  "Please provide a valid phone number"
).isMobilePhone();
const checkPassword = check("password", "Please fill in the password field")
  .not()
  .isEmpty();

router.post("/", [checkEmail, checkPassword], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ errors: [{ msg: "Invalid User Credentials" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(404)
        .json({ errors: [{ msg: "Invalid User Credentials" }] });
    }

    // user = _.omit(user, ['password']);
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    jwt.sign(
      payload,
      process.env.secretToken,
      { expiresIn: 360000 },
      (error, token) => {
        if (error) throw error;
        return res.status(200).json({ user, token });
      }
    );
  } catch (error) {
    console.error("Server Error Occurred", error.mesage);
    return res.status(500).send("Server Error Occurred");
  }
});

// @route    POST api/user/admin
// @desc     Admin login to any user account
// @access   Private
router.post("/admin", [checkEmail, [auth, ROLE("ADMIN")]], async (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) return res.status(400).json({ errors: error.array() });

  const { email } = req.body;
  try {
    let user = await User.findOne({ email }).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ errors: [{ msg: `User with email ${email} not found!` }] });

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.secretToken,
      { expiresIn: 360000 },
      (error, token) => {
        if (error) throw error;
        return res.status(200).json({ user, token });
      }
    );
  } catch (error) {
    console.error("Server Error Occurrd", error.message);
    return res.status(500).send("Server Error Occurred");
  }
});

module.exports = router;
