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
  const page = parseInt(req.query.page, 10) || 1; // getting the 'page' value
  const limit = parseInt(req.query.limit, 10) || 25; // getting the 'limit' value
  const search = req.query.search || "";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const user = await User.find({
      $and: [
        { role: { $ne: "ADMIN" } },
        {
          $or: [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
            { phone: new RegExp(search, "i") },
          ],
        },
      ],
    })
      .select(["-_id", "-password"])
      .skip(startIndex)
      .limit(limit)
      .cache({ expire: 10 });

    const total = await User.countDocuments({ role: { $ne: "ADMIN" } });

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    const results = {
      success: true,
      count: user.length,
      pagination,
      data: user,
    };
    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json("Server error occurred");
  }
});

router.get("/profile", auth, async (req, res) => {
  const id = req.user.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({
        errors: [
          {
            msg: `User profile not found`,
          },
        ],
      });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).send("Server Error Occurred");
  }
  return res.status(200).send("found");
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
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: role } },
      { new: true }
    );

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Something went wrong, user not updated" }] });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).send("Server error occurred");
  }
});

// @route    DELETE api/user
// @desc     Delete user with given email
// @access   Private

router.delete("/", [auth, ROLE("ADMIN")], async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      errors: [
        {
          msg: `Please provide the email for the user to be deleted`,
        },
      ],
    });
  }

  try {
    const user = await User.findOneAndRemove({ email });
    if (!user) {
      return res.status(400).json({
        errors: [
          {
            msg: `Something went wrong, user with email ${email} not deleted`,
          },
        ],
      });
    }
    return res.json({ msg: `User with email ${email} deleted successfully` });
  } catch (error) {
    return res.status(500).send("Server error occurred");
  }
});

module.exports = router;
