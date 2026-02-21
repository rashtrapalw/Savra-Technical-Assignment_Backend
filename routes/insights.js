/**
 * Insights Routes
 */

import express from 'express';
import {
  getDashboardInsights,
  getTeacherInsights,
  getDuplicateAnalysis,
} from '../controllers/insightsController.js';

const router = express.Router();

// GET /api/insights - Get overall dashboard insights
router.get('/', getDashboardInsights);

// GET /api/insights/teacher/:teacherId - Get insights for specific teacher
router.get('/teacher/:teacherId', getTeacherInsights);

// GET /api/insights/duplicates - Get duplicate analysis
router.get('/duplicates', getDuplicateAnalysis);

export default router;
