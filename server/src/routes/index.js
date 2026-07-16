const express = require('express');

const authRoutes = require('./auth.routes');

const hrRoutes = require('./hr.routes');

const documentRoutes = require('./document.routes');

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/hr', hrRoutes);

router.use('/documents', documentRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
