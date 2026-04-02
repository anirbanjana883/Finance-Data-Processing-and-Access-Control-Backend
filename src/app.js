import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// 1. Import routes and custom error class
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// --- Global Middlewares ---
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// --- Mount the Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running perfectly!' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;