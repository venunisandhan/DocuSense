const express = require('express');

const authRoutes = require('./auth.routes');

const hrRoutes = require('./hr.routes');

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/hr', hrRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;