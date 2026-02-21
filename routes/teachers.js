/**
 * Teachers Routes
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getAllTeachers,
  getTeacherDetail,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teachersController.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// GET /api/teachers - Get all teachers with pagination
router.get('/', getAllTeachers);

// GET /api/teachers/:teacherId - Get teacher details
router.get('/:teacherId', getTeacherDetail);

// POST /api/teachers - Create new teacher
router.post(
  '/',
  [
    body('teacher_id').notEmpty().withMessage('teacher_id is required'),
    body('teacher_name').notEmpty().withMessage('teacher_name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('subject').notEmpty().withMessage('subject is required'),
    body('department').notEmpty().withMessage('department is required'),
  ],
  handleValidationErrors,
  createTeacher
);

// PUT /api/teachers/:teacherId - Update teacher
router.put(
  '/:teacherId',
  [
    body('teacher_name').optional().notEmpty().withMessage('teacher_name must not be empty'),
    body('email').optional().isEmail().withMessage('valid email is required'),
    body('subject').optional().notEmpty().withMessage('subject must not be empty'),
    body('department').optional().notEmpty().withMessage('department must not be empty'),
  ],
  handleValidationErrors,
  updateTeacher
);

// DELETE /api/teachers/:teacherId - Delete teacher
router.delete('/:teacherId', deleteTeacher);

export default router;
