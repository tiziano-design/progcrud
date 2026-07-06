const express = require('express');
const router = express.Router();
const { requireRole } = require('../auth');
const { login, register } = require('../services/authService');

router.post('/login', async (req, res, next) => {
  try {
    const result = await login(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/register', requireRole(['superadmin']), async (req, res, next) => {
  try {
    const result = await register(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
