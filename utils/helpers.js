/**
 * Utility functions for duplicate detection and data handling
 */

import crypto from 'crypto';

/**
 * Generate MD5 hash for activity data
 * Used to detect duplicate activities
 * @param {Object} data - Activity data to hash
 * @returns {string} MD5 hash
 */
export const generateDuplicateHash = (data) => {
  const { teacher_id, activity_type, subject, class: className, title } = data;
  const content = `${teacher_id}|${activity_type}|${subject}|${className}|${title}`.toLowerCase();
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Get date range for weekly insights
 * @param {number} weeksBack - Number of weeks to look back (default 4)
 * @returns {Object} Object with startDate and endDate
 */
export const getWeeklyDateRange = (weeksBack = 4) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

/**
 * Format date for API response
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Group activities by week
 * @param {Array} activities - Array of activities
 * @returns {Object} Activities grouped by week
 */
export const groupByWeek = (activities) => {
  const grouped = {};

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = formatDate(weekStart);

    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(activity);
  });

  return grouped;
};

/**
 * Calculate statistics for activities
 * @param {Array} activities - Array of activities
 * @returns {Object} Statistics object
 */
export const calculateStats = (activities) => {
  const stats = {
    total: activities.length,
    lessons: 0,
    quizzes: 0,
    assessments: 0,
    duplicates: 0,
    unique: 0,
  };

  activities.forEach((activity) => {
    if (activity.activity_type === 'lesson') stats.lessons++;
    if (activity.activity_type === 'quiz') stats.quizzes++;
    if (activity.activity_type === 'assessment') stats.assessments++;
    if (activity.is_duplicate) stats.duplicates++;
  });

  stats.unique = stats.total - stats.duplicates;

  return stats;
};

/**
 * Validate activity data
 * @param {Object} data - Activity data to validate
 * @returns {Object} Validation result { isValid: boolean, errors: Array }
 */
export const validateActivityData = (data) => {
  const errors = [];

  if (!data.teacher_id) errors.push('teacher_id is required');
  if (!data.activity_type || !['lesson', 'quiz', 'assessment'].includes(data.activity_type)) {
    errors.push('activity_type must be one of: lesson, quiz, assessment');
  }
  if (!data.subject) errors.push('subject is required');
  if (!data.class) errors.push('class is required');
  if (!data.title) errors.push('title is required');

  return {
    isValid: errors.length === 0,
    errors,
  };
};
