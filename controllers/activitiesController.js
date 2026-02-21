/**
 * Activities Controller - Activity management with duplicate detection
 */

import Activity from '../models/Activity.js';
import { generateDuplicateHash, validateActivityData } from '../utils/helpers.js';

/**
 * Get all activities for a teacher
 * GET /api/activities
 */
export const getActivities = async (req, res, next) => {
  try {
    const { teacherId, activityType, subject, includeDuplicates = false, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (teacherId) query.teacher_id = teacherId;
    if (activityType) query.activity_type = activityType;
    if (subject) query.subject = subject;
    if (includeDuplicates === 'false') query.is_duplicate = false;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get activities
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new activity with duplicate detection
 * POST /api/activities
 */
export const createActivity = async (req, res, next) => {
  try {
    const { teacher_id, activity_type, subject, class: className, title, description, created_by_name } = req.body;

    // Validate input
    const validation = validateActivityData({
      teacher_id,
      activity_type,
      subject,
      class: className,
      title,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.errors,
      });
    }

    // Generate duplicate hash
    const duplicateHash = generateDuplicateHash({
      teacher_id,
      activity_type,
      subject,
      class: className,
      title,
    });

    // Check if this is a duplicate
    const existingActivity = await Activity.findOne({ duplicate_hash: duplicateHash }).lean();

    let newActivity;
    if (existingActivity) {
      // This is a duplicate - create with duplicate flag
      newActivity = new Activity({
        teacher_id,
        activity_type,
        subject,
        class: className,
        title,
        description,
        created_by_name,
        duplicate_hash: duplicateHash,
        is_duplicate: true,
        original_id: existingActivity._id,
      });
    } else {
      // This is unique
      newActivity = new Activity({
        teacher_id,
        activity_type,
        subject,
        class: className,
        title,
        description,
        created_by_name,
        duplicate_hash: duplicateHash,
        is_duplicate: false,
      });
    }

    await newActivity.save();

    res.status(201).json({
      success: true,
      message: existingActivity ? 'Activity created (duplicate detected)' : 'Activity created successfully',
      data: {
        activity: newActivity,
        isDuplicate: !!existingActivity,
        originalId: existingActivity?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity by ID
 * GET /api/activities/:activityId
 */
export const getActivityDetail = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId)
      .populate('original_id', 'title activity_type subject class teacher_id')
      .lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // If this is not a duplicate, get any duplicates of it
    let duplicates = [];
    if (!activity.is_duplicate) {
      duplicates = await Activity.find(
        { original_id: activityId },
        { _id: 1, teacher_id: 1, created_by_name: 1, createdAt: 1 }
      )
        .sort({ createdAt: 1 })
        .lean();
    }

    res.json({
      success: true,
      data: {
        activity,
        duplicateCount: duplicates.length,
        duplicates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update activity
 * PUT /api/activities/:activityId
 */
export const updateActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { title, description, subject, class: className } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        title: title || undefined,
        description: description || undefined,
        subject: subject || undefined,
        class: className || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete activity
 * DELETE /api/activities/:activityId
 */
export const deleteActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // If this activity has duplicates, update their original_id
    if (!activity.is_duplicate) {
      await Activity.updateMany(
        { original_id: activityId },
        { original_id: null, is_duplicate: false }
      );
    }

    await Activity.findByIdAndDelete(activityId);

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get duplicate activities
 * GET /api/activities/duplicates
 */
export const getDuplicateActivities = async (req, res, next) => {
  try {
    const { teacherId, page = 1, limit = 20 } = req.query;

    const query = { is_duplicate: true };
    if (teacherId) query.teacher_id = teacherId;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const duplicates = await Activity.find(query)
      .populate('original_id', 'title activity_type subject class teacher_id created_by_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      data: {
        duplicates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk upload activities
 * POST /api/activities/bulk
 */
export const bulkCreateActivities = async (req, res, next) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'activities array is required and must not be empty',
      });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < activities.length; i++) {
      try {
        const actData = activities[i];

        // Validate
        const validation = validateActivityData(actData);
        if (!validation.isValid) {
          errors.push({ index: i, message: validation.errors.join(', ') });
          continue;
        }

        // Generate hash
        const duplicateHash = generateDuplicateHash(actData);

        // Check for duplicate
        const existing = await Activity.findOne({ duplicate_hash: duplicateHash }).lean();

        const newAct = new Activity({
          teacher_id: actData.teacher_id,
          activity_type: actData.activity_type,
          subject: actData.subject,
          class: actData.class,
          title: actData.title,
          description: actData.description || '',
          created_by_name: actData.created_by_name,
          duplicate_hash: duplicateHash,
          is_duplicate: !!existing,
          original_id: existing?._id || null,
        });

        await newAct.save();
        created.push(newAct);
      } catch (err) {
        errors.push({ index: i, message: err.message });
      }
    }

    res.status(201).json({
      success: errors.length === 0,
      message: `${created.length} activities created${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        created: created.length,
        failed: errors.length,
        activities: created,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
};
