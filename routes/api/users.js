const express = require('express');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./../../models/User');

const router = express.Router();


// @route GET api/user
// @desc GET All User route
// @access Public
router.get('/', (req, res)=> {
    return res.json({users: []});
})

// @route POST api/user
// @desc Register new USER route
// @access Public
const checkName = check('name', 'Name is Required').not().isEmpty();
const checkEmail = check('email', 'Please provide a valid Email').isEmail();
const checkPassword = check('password', 'Password is required').not().isEmpty();
const checkPhone = check('phone', 'Please provide a valid phone number').isMobilePhone();

router.post('/', [checkName, checkEmail, checkPassword, checkPhone], async (req, res)=> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ errors: [{msg: `User with email ${email} already exists`}]});
        }

        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({ name, email, phone, password, avatar });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        }
        jwt.sign(
            payload, 
            process.env.secretToken,
            { expiresIn: 3600000 },
            (error, token) => {
                if (error) throw error;
                return res.status(201).json({ user, token });
            }
            )
    } catch (error) {
        console.error('server error occurred', error.message);
        return res.status(500).send('Server Error Occurred');
    }
})

module.exports = router;