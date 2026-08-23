const express = require('express');
const router = express.Router();
const laberController = require('../control/laberController.js');
const { authMiddleware, adminOnly } = require('../middleware/auth.js');

router.post('/register', laberController.register);
router.post('/login', laberController.login);
router.get('/employee/:id', laberController.getById);

router.post('/laborers', laberController.createLaborerDataCo);
router.get('/laborers', laberController.getAllLaborerDataCo);
router.get('/analysis/:laborers_id', authMiddleware, laberController.getAnalysisLaborerDataCo);

router.get('/', authMiddleware, laberController.getAll);
router.get('/:id', authMiddleware, laberController.getById);
router.put('/:id', authMiddleware, adminOnly, laberController.update);
router.delete('/:id', authMiddleware, adminOnly, laberController.delete);


module.exports = router;