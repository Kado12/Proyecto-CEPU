const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');

router.get('/student', studentsController.getStudents)
router.get('/student/:id', studentsController.getStudentById)
router.post('/student', studentsController.createNewRegister)
router.put('/student/:id', studentsController.updatedRegister)
router.delete('/student/:id', studentsController.deletedRegister)

module.exports = router;