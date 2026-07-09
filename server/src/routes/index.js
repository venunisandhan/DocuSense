
const express = require('express');

const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/auth', authRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;