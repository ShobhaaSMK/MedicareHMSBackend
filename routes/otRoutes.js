const express = require('express');
const router = express.Router();
const otController = require('../controllers/otController');

router.get('/', otController.getAllOTs);
router.get('/by-otno/:otNo', otController.getOTByNo);
router.get('/by-type/:otType', otController.getOTByType);
router.get('/:id', otController.getOTById);
router.post('/', otController.createOT);
router.put('/:id', otController.updateOT);
router.delete('/:id', otController.deleteOT);

module.exports = router;

