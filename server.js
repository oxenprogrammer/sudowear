const express = require('express');
const users = require('./routes/api/users');
const {router, adminBro} = require('./routes/api/admin-bro');

const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(adminBro.options.rootPath, router);
app.use('/api/users', users);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`SudoWear running on port ${PORT}!!!`));

module.exports = server;