const express = require('express');
const router = express.Router();
const icuNurseVisitsController = require('../controllers/icuNurseVisitsController');

router.get('/', icuNurseVisitsController.getAllICUNurseVisits);
router.get('/:id', icuNurseVisitsController.getICUNurseVisitsById);
router.post('/', icuNurseVisitsController.createICUNurseVisits);
router.put('/:id', icuNurseVisitsController.updateICUNurseVisits);
router.delete('/:id', icuNurseVisitsController.deleteICUNurseVisits);

module.exports = router;

