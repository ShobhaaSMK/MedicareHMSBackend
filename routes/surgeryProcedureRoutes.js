const express = require('express');
const router = express.Router();
const surgeryProcedureController = require('../controllers/surgeryProcedureController');

router.get('/', surgeryProcedureController.getAllSurgeryProcedures);
router.get('/by-type/:surgeryType', surgeryProcedureController.getSurgeryProceduresByType); // Specific route first
router.get('/:id', surgeryProcedureController.getSurgeryProcedureById); // Generic route after specific
router.post('/', surgeryProcedureController.createSurgeryProcedure);
router.put('/:id', surgeryProcedureController.updateSurgeryProcedure);
router.delete('/:id', surgeryProcedureController.deleteSurgeryProcedure);

module.exports = router;

