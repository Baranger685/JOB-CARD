const express = require('express');
const router = express.Router();
const laberController = require('../control/laberController.js');
const { authMiddleware, adminOnly } = require('../middleware/auth.js');

// Public Routes 
router.post('/register', laberController.register);
router.post('/login', laberController.login);

// Protected Routes 
router.get('/', authMiddleware, laberController.getAll);
router.get('/:id', authMiddleware, laberController.getById);

// Admin Only Routes 
router.put('/:id', authMiddleware, adminOnly, laberController.update);
router.delete('/:id', authMiddleware, adminOnly, laberController.delete);

module.exports = router;