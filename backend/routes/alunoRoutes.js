const express = require('express');
const router = express.Router();

const alunoController = require('../controllers/alunoController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/', auth, role.isProfessor, alunoController.list);
router.post('/', auth, role.isProfessor, alunoController.create);
router.put('/:id', auth, role.isProfessor, alunoController.update);
router.delete('/:id', auth, role.isProfessor, alunoController.delete);

module.exports = router;
