const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');


router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/forgot', userController.forgotPassword);
router.get('/list', auth, role.isAdmin, userController.list);
router.delete('/:id', auth, role.isAdmin, userController.delete);

module.exports = router;
