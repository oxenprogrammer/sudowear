const express = require('express');
const users = require('./routes/api/users');
const auth = require('./routes/api/auth');
const products = require('./routes/api/product');
const { router, adminBro } = require('./routes/api/admin-bro');
const connectDB = require('./config/db');

require('./util/redis');

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(express.json({ extended: false }));
app.use(adminBro.options.rootPath, router);
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use('/api/products', products);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`SudoWear running on port ${PORT}!!!`));

module.exports = server;