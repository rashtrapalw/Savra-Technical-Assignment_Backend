/**
 * Activities Routes
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getActivities,
  createActivity,
  getActivityDetail,
  updateActivity,
  deleteActivity,
  getDuplicateActivities,
  bulkCreateActivities,
} from '../controllers/activitiesController.js';
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// GET /api/activities - Get all activities with filters
router.get('/', getActivities);

// GET /api/activities/duplicates - Get only duplicate activities
router.get('/duplicates', getDuplicateActivities);

// GET /api/activities/:activityId - Get activity details
router.get('/:activityId', getActivityDetail);

// POST /api/activities - Create new activity
router.post(
  '/',
  [
    body('teacher_id').notEmpty().withMessage('teacher_id is required'),
    body('activity_type')
      .isIn(['lesson', 'quiz', 'assessment'])
      .withMessage('activity_type must be lesson, quiz, or assessment'),
    body('subject').notEmpty().withMessage('subject is required'),
    body('class').notEmpty().withMessage('class is required'),
    body('title').notEmpty().withMessage('title is required'),
    body('description').optional().isString().withMessage('description must be a string'),
    body('created_by_name').optional().isString().withMessage('created_by_name must be a string'),
  ],
  handleValidationErrors,
  createActivity
);

// POST /api/activities/bulk - Bulk upload activities
router.post('/bulk', bulkCreateActivities);

// PUT /api/activities/:activityId - Update activity
router.put(
  '/:activityId',
  [
    body('title').optional().notEmpty().withMessage('title must not be empty'),
    body('description').optional().isString().withMessage('description must be a string'),
    body('subject').optional().notEmpty().withMessage('subject must not be empty'),
    body('class').optional().notEmpty().withMessage('class must not be empty'),
  ],
  handleValidationErrors,
  updateActivity
);

// DELETE /api/activities/:activityId - Delete activity
router.delete('/:activityId', deleteActivity);

export default router;
