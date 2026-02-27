const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');

router.get('/', salaController.list);
router.post('/', salaController.create);

module.exports = router;
