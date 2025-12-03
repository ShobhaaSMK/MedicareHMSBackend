const express = require('express');
const router = express.Router();
const icuDoctorVisitsController = require('../controllers/icuDoctorVisitsController');

router.get('/', icuDoctorVisitsController.getAllICUDoctorVisits);
router.get('/:id', icuDoctorVisitsController.getICUDoctorVisitsById);
router.post('/', icuDoctorVisitsController.createICUDoctorVisits);
router.put('/:id', icuDoctorVisitsController.updateICUDoctorVisits);
router.delete('/:id', icuDoctorVisitsController.deleteICUDoctorVisits);

module.exports = router;

