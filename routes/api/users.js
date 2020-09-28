const express = require('express');
const router = express.Router();


// @route GET api/user
// @desc GET All User route
// @access Public
router.get('/', (req, res)=> {
    return res.json({users: []});
})

module.exports = router;