/**
 * Insights Controller - Analytics and dashboard data
 */

import Activity from '../models/Activity.js';
import Teacher from '../models/Teacher.js';
import { calculateStats, groupByWeek, formatDate, getWeeklyDateRange } from '../utils/helpers.js';

/**
 * Get overall dashboard insights
 * GET /api/insights
 */
export const getDashboardInsights = async (req, res, next) => {
  try {
    const { weeksBack = 4 } = req.query;
    const { startDate, endDate } = getWeeklyDateRange(parseInt(weeksBack));

    // Get activities for the date range
    const activities = await Activity.find({
      createdAt: { $gte: startDate, $lte: endDate },
      is_duplicate: false,
    });

    // Calculate overall stats
    const stats = calculateStats(activities);

    // Get total teachers count
    const teacherCount = await Teacher.countDocuments();

    // Group activities by week
    const weekly = groupByWeek(activities);

    // Convert to array for frontend
    const weeklyData = Object.entries(weekly).map(([week, acts]) => {
      const weekStats = calculateStats(acts);
      return {
        week,
        lessons: weekStats.lessons,
        quizzes: weekStats.quizzes,
        assessments: weekStats.assessments,
        total: weekStats.total,
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        teacherCount,
        weeklyData: weeklyData.sort((a, b) => new Date(a.week) - new Date(b.week)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get insights for a specific teacher
 * GET /api/insights/teacher/:teacherId
 */
export const getTeacherInsights = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { weeksBack = 4 } = req.query;
    const { startDate, endDate } = getWeeklyDateRange(parseInt(weeksBack));

    // Verify teacher exists
    const teacher = await Teacher.findOne({ teacher_id: teacherId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Get activities for this teacher
    const activities = await Activity.find({
      teacher_id: teacherId,
      createdAt: { $gte: startDate, $lte: endDate },
      is_duplicate: false,
    });

    // Calculate stats
    const stats = calculateStats(activities);

    // Group by week
    const weekly = groupByWeek(activities);

    // Group by subject
    const bySubject = {};
    activities.forEach((activity) => {
      if (!bySubject[activity.subject]) {
        bySubject[activity.subject] = [];
      }
      bySubject[activity.subject].push(activity);
    });

    const subjectData = Object.entries(bySubject).map(([subject, acts]) => ({
      subject,
      ...calculateStats(acts),
    }));

    // Convert weekly to array
    const weeklyData = Object.entries(weekly).map(([week, acts]) => {
      const weekStats = calculateStats(acts);
      return {
        week,
        lessons: weekStats.lessons,
        quizzes: weekStats.quizzes,
        assessments: weekStats.assessments,
        total: weekStats.total,
      };
    });

    res.json({
      success: true,
      data: {
        teacher: {
          teacher_id: teacher.teacher_id,
          teacher_name: teacher.teacher_name,
          email: teacher.email,
          subject: teacher.subject,
          department: teacher.department,
        },
        stats,
        subjectData,
        weeklyData: weeklyData.sort((a, b) => new Date(a.week) - new Date(b.week)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get duplicate analysis
 * GET /api/insights/duplicates
 */
export const getDuplicateAnalysis = async (req, res, next) => {
  try {
    // Get all duplicate activities
    const duplicates = await Activity.find({ is_duplicate: true })
      .populate('original_id', 'title activity_type subject class')
      .lean();

    // Group by original activity
    const analysis = {};
    duplicates.forEach((dup) => {
      const origId = dup.original_id?._id?.toString() || 'unknown';
      if (!analysis[origId]) {
        analysis[origId] = {
          original: dup.original_id,
          duplicateCount: 0,
          duplicates: [],
        };
      }
      analysis[origId].duplicateCount++;
      analysis[origId].duplicates.push({
        _id: dup._id,
        teacher_id: dup.teacher_id,
        activity_type: dup.activity_type,
      });
    });

    const analysisArray = Object.values(analysis);

    res.json({
      success: true,
      data: {
        totalDuplicates: duplicates.length,
        groupCount: analysisArray.length,
        analysis: analysisArray,
      },
    });
  } catch (error) {
    next(error);
  }
};
