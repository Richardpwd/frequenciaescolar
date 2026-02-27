const express = require('express');
const router = express.Router();
const calController = require('../controllers/calController');

router.get('/', calController.list);
router.post('/', calController.create);

module.exports = router;
