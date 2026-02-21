/**
 * Activity Model - MongoDB Schema
 */

import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    teacher_id: {
      type: String,
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    activity_type: {
      type: String,
      enum: ['lesson', 'quiz', 'assessment'],
      required: [true, 'Activity type is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      default: '',
    },
    duplicate_hash: {
      type: String,
      unique: true,
      sparse: true,
    },
    is_duplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    original_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    created_by_name: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
activitySchema.index({ teacher_id: 1, is_duplicate: 1 });
activitySchema.index({ activity_type: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ subject: 1 });
activitySchema.index({ class: 1 });

export default mongoose.model('Activity', activitySchema);
