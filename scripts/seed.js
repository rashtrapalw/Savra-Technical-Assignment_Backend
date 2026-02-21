/**
 * Database Seed Script
 * Run: node scripts/seed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from '../models/Teacher.js';
import Activity from '../models/Activity.js';
import { generateDuplicateHash } from '../utils/helpers.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_insights';

// Sample teachers data
const teachersData = [
  {
    teacher_id: 'T001',
    teacher_name: 'Rajesh Kumar',
    email: 'rajesh.kumar@school.com',
    subject: 'Mathematics',
    department: 'Science',
  },
  {
    teacher_id: 'T002',
    teacher_name: 'Priya Sharma',
    email: 'priya.sharma@school.com',
    subject: 'English',
    department: 'Language',
  },
  {
    teacher_id: 'T003',
    teacher_name: 'Amit Patel',
    email: 'amit.patel@school.com',
    subject: 'Physics',
    department: 'Science',
  },
  {
    teacher_id: 'T004',
    teacher_name: 'Neha Verma',
    email: 'neha.verma@school.com',
    subject: 'History',
    department: 'Social Studies',
  },
  {
    teacher_id: 'T005',
    teacher_name: 'Deepak Joshi',
    email: 'deepak.joshi@school.com',
    subject: 'Chemistry',
    department: 'Science',
  },
];

// Sample activities template
const generateActivitiesForTeacher = (teacherId, teacherName) => {
  const activities = [];
  const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History'];
  const classes = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const activityTypes = ['lesson', 'quiz', 'assessment'];

  const titles = {
    lesson: [
      'Introduction to Quadratic Equations',
      'Shakespeare: Romeo and Juliet',
      'Newton\'s Laws of Motion',
      'Periodic Table Fundamentals',
      'Ancient Indian History',
      'English Grammar Basics',
      'Organic Chemistry',
      'Biology Cell Structure',
    ],
    quiz: [
      'Algebra Quick Quiz',
      'Literature Comprehension',
      'Physics Problem Solving',
      'Chemistry Elements',
      'History Timeline',
      'Vocabulary Test',
      'Math Calculation',
      'Science Facts',
    ],
    assessment: [
      'Mid-term Examination',
      'Final Assessment',
      'Unit Test',
      'Project Evaluation',
      'Assignment Review',
      'Practical Assessment',
      'Written Exam',
      'Oral Presentation',
    ],
  };

  // Generate 15-20 activities per teacher
  const activityCount = 15 + Math.floor(Math.random() * 6);

  for (let i = 0; i < activityCount; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const classLevel = classes[Math.floor(Math.random() * classes.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const titleList = titles[type];
    const title = titleList[Math.floor(Math.random() * titleList.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    activities.push({
      teacher_id: teacherId,
      activity_type: type,
      subject,
      class: classLevel,
      title: `${title} (${Math.floor(i / 2)})`,
      description: `This is a ${type} on ${subject} for ${classLevel}`,
      created_by_name: teacherName,
      createdAt,
    });
  }

  return activities;
};

// Main seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Teacher.deleteMany({});
    await Activity.deleteMany({});

    // Seed teachers
    console.log('👨‍🏫 Creating teachers...');
    const createdTeachers = await Teacher.insertMany(teachersData);
    console.log(`✅ Created ${createdTeachers.length} teachers`);

    // Seed activities
    console.log('📝 Creating activities...');
    const allActivities = [];

    for (const teacher of createdTeachers) {
      const teacherActivities = generateActivitiesForTeacher(teacher.teacher_id, teacher.teacher_name);

      // Generate hashes for duplicate detection
      const processedActivities = [];
      const hashSet = new Set();

      for (const activity of teacherActivities) {
        const hash = generateDuplicateHash(activity);

        if (hashSet.has(hash)) {
          // This is a duplicate
          activity.duplicate_hash = hash;
          activity.is_duplicate = true;
        } else {
          // This is unique
          activity.duplicate_hash = hash;
          activity.is_duplicate = false;
          hashSet.add(hash);
        }

        processedActivities.push(activity);
      }

      // Add cross-teacher duplicates (simulate some teachers creating same content)
      if (Math.random() > 0.4) {
        const sharedActivities = teacherActivities.slice(0, 2);
        for (const activity of sharedActivities) {
          const duplicateActivity = {
            ...activity,
            teacher_id: `T00${Math.floor(Math.random() * 5) + 1}`,
            created_by_name: 'System Import',
            is_duplicate: true,
            duplicate_hash: activity.duplicate_hash,
          };
          allActivities.push(duplicateActivity);
        }
      }

      allActivities.push(...processedActivities);
    }

    // Insert all activities
    const createdActivities = await Activity.insertMany(allActivities);
    console.log(`✅ Created ${createdActivities.length} activities`);

    // Calculate statistics
    const uniqueActivities = createdActivities.filter((a) => !a.is_duplicate).length;
    const duplicateActivities = createdActivities.filter((a) => a.is_duplicate).length;

    console.log('');
    console.log('📊 Database Statistics:');
    console.log(`   Teachers: ${createdTeachers.length}`);
    console.log(`   Total Activities: ${createdActivities.length}`);
    console.log(`   Unique Activities: ${uniqueActivities}`);
    console.log(`   Duplicate Activities: ${duplicateActivities}`);
    console.log('');
    console.log('✨ Database seeding completed successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
