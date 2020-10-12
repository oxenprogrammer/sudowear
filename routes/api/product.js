const express = require('express');
const { check, validationResult } = require('express-validator');
const upload = require('./../../middlewares/upload');
const auth = require('./../../middlewares/auth');
const ROLE = require('./../../middlewares/roles');
const Product = require('./../../models/Product');

const router = express.Router();

router.get('/', (req, res) => {
    return res.status(200).json({ 'get_product works': 'product' });
});

// desc
const checkTitle = check('title', 'T-Shirt title is required').not().isEmpty();
const checkDesc = check('desc', 'Please provide the T-Shirt description').not().isEmpty();
const checkPrice = check('price', 'Please enter the T-Shirt price').isNumeric();
const checkQuantity = check('quantity', 'Please enter the number of T-Shirts').isNumeric();
router.post('/', [upload.array('shirt_image', 4), [checkTitle, checkDesc, checkPrice, checkQuantity], auth, ROLE('ADMIN')], async (req, res) => {
    // const shirtImage = typeof req.files['shirt_image'] !== "undefined" ? req.files['shirt_image'][0].filename : '';
    // req.checkBody('shirt_image', 'Please upload an image Jpeg, Png or Jpg').isImage(shirtImage);
    console.log('req.files', req.files);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, desc, price, quantity } = req.body;

    try {
        let product = await Product.findOne({ title });
        if (product) {
            return res.status(409).json({
                errors: [
                    {
                        msg: `T-shirt with named ${title} already exists`,
                    },
                ],
            });
        }

        product = new Product({
            title,
            price,
            desc,
            quantity
        });

        if (req.files) {
            const imageURIs = [];
            const files = req.files;
            for (const file of files) {
                const { path } = file;
                imageURIs.push(path);
            };

            product['images'] = imageURIs;

            await product.save();
            return res.status(201).json({ product });
            
        } else if (req.file && req.file.path) {
            product['images'] = req.file.path;
            await product.save();
            return res.status(201).json({ product });
        };

        return res.status(400).json({
            errors: [
                {
                    msg: `Please upload an image`,
                },
            ],
        });
    } catch (error) {
        console.error("server error occurred", error.message);
        return res.status(500).send("Server Error Occurred");
    }
});

module.exports = router;