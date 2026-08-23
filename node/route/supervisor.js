const express = require('express');
const router = express.Router();
const supervisorController = require('../control/supervior.js');
const { authMiddleware } = require('../middleware/auth.js');

router.post('/supervisor', authMiddleware, supervisorController.createSupervisorDataCo);
router.get('/supervisor', authMiddleware, supervisorController.getAllSupervisorDataCo);
router.get('/supervisor/:id', authMiddleware, supervisorController.getByIdSupervisorDataCo);
router.put('/supervisor/:id', authMiddleware, supervisorController.updateSupervisorDataCo);
router.delete('/supervisor/:id', authMiddleware, supervisorController.deleteSupervisorDataCo);

module.exports = router;