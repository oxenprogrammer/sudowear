const express = require("express");
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./../../middlewares/auth");
const ROLE = require("./../../middlewares/roles");
require("dotenv").config();

const User = require("./../../models/User");

const router = express.Router();

// @route    GET api/user
// @desc     Get All User route
// @access   Private
router.get("/", [auth, ROLE("ADMIN")], async (req, res) => {
  try {
    const user = await User.find({ role: { $ne: "ADMIN" } }).select([
      "-_id",
      "-password",
    ]).cache({ expire: 10 });
    return res.json(user);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json("Server error occurred");
  }
});

// @route    GET api/user
// @desc     Search users with name, email, or phone number
// @access   Private
router.post("/search", [auth, ROLE("ADMIN")], async (req, res) => {
  const { query_value } = req.body;
  if (!query_value) return res.status(400).json({
    errors: [
      {
        msg: `Bad Request`,
      },
    ],
  });
  try {
    const user = await User.find({
      $and: [{ role: { $ne: "ADMIN" } },
      {
        $or: [
          { name: new RegExp(query_value, 'i') },
          { email: new RegExp(query_value, 'i') },
          { phone: new RegExp(query_value, 'i') }]
      }
      ],
    }).select(["-_id", "-password"]);
    if (!user) {
      return res.status(404).json({
        errors: [
          {
            msg: `Cleint with the given ${query_value} not found`,
          },
        ],
      });
    }
    return res.json({ user });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json("Server error occurred");
  }
});

// @route POST api/user
// @desc Register new USER route
// @access Public
const checkName = check("name", "Name is Required").not().isEmpty();
const checkEmail = check("email", "Please provide a valid Email").isEmail();
const checkPassword = check("password", "Password is required").not().isEmpty();
const checkPhone = check(
  "phone",
  "Please provide a valid phone number"
).isMobilePhone();

router.post(
  "/",
  [checkName, checkEmail, checkPassword, checkPhone],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    try {
      let user = await User.findOne({
        $or: [{ email }, { phone }],
      });
      if (user) {
        return res.status(409).json({
          errors: [
            {
              msg: `User with email ${email} or phone ${phone} already exists`,
            },
          ],
        });
      }

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({ name, email, phone, password, avatar });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
      jwt.sign(
        payload,
        process.env.secretToken,
        { expiresIn: 3600000 },
        (error, token) => {
          if (error) throw error;
          return res.status(201).json({ user, token });
        }
      );
    } catch (error) {
      console.error("server error occurred", error.message);
      return res.status(500).send("Server Error Occurred");
    }
  }
);

// @route    PATCH api/user
// @desc     Update User Role route
// @access   Private

router.patch("/", [auth, ROLE("ADMIN")], async (req, res) => {
  const { email, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ errors: [{ msg: "No user with this email" }] });
    }

    user = await User.findOneAndUpdate(
      { email },
      { $set: { role: role } },
      { new: true }
    );
    return res.json(user);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

// @route    DELETE api/user
// @desc     Delete user with given email
// @access   Private

router.delete("/", [auth, ROLE("ADMIN")], async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ errors: [{ msg: "No user with this email" }] });
    }

    user = await User.findOneAndRemove({ email });
    return res.json({ msg: `User with email ${email} deleted successfully` });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

module.exports = router;
