/**
 * Teacher Model - MongoDB Schema
 */

import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    teacher_id: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
    },
    teacher_name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      sparse: true,
    },
    subject: {
      type: String,
      default: 'General',
    },
    department: {
      type: String,
      default: 'Academic',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
teacherSchema.index({ teacher_id: 1 });
teacherSchema.index({ teacher_name: 1 });

export default mongoose.model('Teacher', teacherSchema);
