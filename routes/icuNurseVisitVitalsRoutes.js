const express = require('express');
const router = express.Router();
const icuNurseVisitVitalsController = require('../controllers/icuNurseVisitVitalsController');

router.get('/', icuNurseVisitVitalsController.getAllICUNurseVisitVitals);
router.get('/:id', icuNurseVisitVitalsController.getICUNurseVisitVitalsById);
router.post('/', icuNurseVisitVitalsController.createICUNurseVisitVitals);
router.put('/:id', icuNurseVisitVitalsController.updateICUNurseVisitVitals);
router.delete('/:id', icuNurseVisitVitalsController.deleteICUNurseVisitVitals);

module.exports = router;

