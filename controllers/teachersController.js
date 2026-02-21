/**
 * Teachers Controller - Teacher management
 */

import Teacher from '../models/Teacher.js';
import Activity from '../models/Activity.js';

/**
 * Get all teachers
 * GET /api/teachers
 */
export const getAllTeachers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build search query
    const query = search
      ? {
          $or: [
            { teacher_name: { $regex: search, $options: 'i' } },
            { teacher_id: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get teachers with pagination
    const teachers = await Teacher.find(query)
      .sort({ teacher_name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: {
        teachers,
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
 * Get single teacher with activity summary
 * GET /api/teachers/:teacherId
 */
export const getTeacherDetail = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    // Get teacher
    const teacher = await Teacher.findOne({ teacher_id: teacherId }).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Get activity summary for this teacher
    const allActivities = await Activity.find({ teacher_id: teacherId }).lean();

    const summary = {
      totalActivities: allActivities.length,
      lessons: allActivities.filter((a) => a.activity_type === 'lesson').length,
      quizzes: allActivities.filter((a) => a.activity_type === 'quiz').length,
      assessments: allActivities.filter((a) => a.activity_type === 'assessment').length,
      duplicates: allActivities.filter((a) => a.is_duplicate).length,
      uniqueActivities: allActivities.filter((a) => !a.is_duplicate).length,
    };

    // Get subjects
    const subjects = [...new Set(allActivities.map((a) => a.subject))];

    res.json({
      success: true,
      data: {
        teacher,
        summary,
        subjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new teacher
 * POST /api/teachers
 */
export const createTeacher = async (req, res, next) => {
  try {
    const { teacher_id, teacher_name, email, subject, department } = req.body;

    // Check if teacher already exists
    const existing = await Teacher.findOne({ teacher_id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Teacher with this ID already exists',
      });
    }

    // Create new teacher
    const teacher = new Teacher({
      teacher_id,
      teacher_name,
      email,
      subject,
      department,
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update teacher
 * PUT /api/teachers/:teacherId
 */
export const updateTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { teacher_name, email, subject, department } = req.body;

    const teacher = await Teacher.findOneAndUpdate(
      { teacher_id: teacherId },
      { teacher_name, email, subject, department },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete teacher
 * DELETE /api/teachers/:teacherId
 */
export const deleteTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findOneAndDelete({ teacher_id: teacherId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Also delete associated activities
    await Activity.deleteMany({ teacher_id: teacherId });

    res.json({
      success: true,
      message: 'Teacher and associated activities deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
