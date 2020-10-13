const express = require('express');
const { check, validationResult } = require('express-validator');
const upload = require('./../../middlewares/upload');
const auth = require('./../../middlewares/auth');
const ROLE = require('./../../middlewares/roles');
const Product = require('./../../models/Product');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1; // getting the 'page' value
    const limit = parseInt(req.query.limit, 10) || 25; // getting the 'limit' value
    const search = req.query.search || '';
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    try {
        const tshirts = await Product.find({
            $or: [
                { title: new RegExp(search, 'i') },
                { price: new RegExp(search, 'i') }
            ]
        })
            .skip(startIndex)
            .limit(limit)
            .cache({ expire: 10 });

        const total = await Product.countDocuments();
        console.log('total', total);

        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }

        const results = {
            success: true,
            count: tshirts.length,
            pagination,
            data: tshirts
        }
        res.status(200).json(results);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json("Server error occurred");
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            errors: [
                {
                    msg: `Invalid T-Shirt ID`,
                },
            ]
        });
    };
    const tShirt = await Product.findById(id).cache({ expire: 10 });;
    if (!tShirt) {
        return res.status(404).json({
            errors: [
                {
                    msg: `T-Shirt not found`,
                },
            ]
        });
    }

    return res.status(200).json({ tShirt });

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

router.patch('/:id', [auth, ROLE('ADMIN')], async (req, res) => {
    const id = req.params.id;
    const { quantity, price, isAvailable, title, desc } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            errors: [
                {
                    msg: `Please provide a valid ObjectId`,
                },
            ]
        });
    };

    if (!quantity || !price || !isAvailable || !title || !desc) {
        return res.status(400).json({
            errors: [
                {
                    msg: `Please provide the t-Shirt properties to update`,
                },
            ]
        });
    }

    try {
        const tShirt = await Product.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!tShirt) {
            return res.status(404).json({
                errors: [
                    {
                        msg: `Couldn't update the tShirt`,
                    },
                ]
            });
        }

        return res.status(200).json({ tShirt });

    } catch (error) {
        console.error("server error occurred", error.message);
        return res.status(500).send("Server Error Occurred");
    }
});

router.delete("/", [auth, ROLE("ADMIN")], async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({
            errors: [
                {
                    msg: `Please provide the title for the tee to be deleted`,
                },
            ]
        });
    }

    try {
        const tshirt = await Product.findOneAndRemove({ title });
        if (!tshirt) {
            return res
                .status(400)
                .json({ errors: [{ msg: `Something went wrong, tshirt not deleted` }] });
        }
        return res.json({ msg: `T-Shirt labelled ${title} deleted successfully` });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send("Server error occurred");
    }
});

module.exports = router;