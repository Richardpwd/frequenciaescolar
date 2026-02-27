const express = require('express');
const router = express.Router();

const freqController = require('../controllers/freqController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/:sala_id', auth, role.isProfessor, freqController.getBySala);
router.post('/marcar', auth, role.isProfessor, freqController.marcar);

module.exports = router;
