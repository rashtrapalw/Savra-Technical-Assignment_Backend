/**
 * Express Server - Savra Teacher Insights Dashboard
 * Main server entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/validators.js';
import insightsRoutes from './routes/insights.js';
import teacherRoutes from './routes/teachers.js';
import activityRoutes from './routes/activities.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/savra-insights';

// Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
//   credentials: true,
// }));

app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Routes
app.use('/api/insights', insightsRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/activities', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
//   console.log(`
// ╔══════════════════════════════════════════╗
// ║  Savra Teacher Insights Dashboard        ║
// ║  Backend Server Running                 ║
// ║  Port: ${PORT}                          ║
// ║  Environment: ${process.env.NODE_ENV || 'development'}         ║
// ╚══════════════════════════════════════════╝
//   `);
});

export default app;
