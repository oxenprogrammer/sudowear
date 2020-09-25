const express = require('express');

const app = express();

// Middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`SudoWear running on port ${PORT}!!!`));

module.exports = server;