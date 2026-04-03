import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express'; 
import yaml from 'yamljs';                  
import path from 'path';

//  custom error class
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import transactionRoutes from './routes/transaction.route.js';
import dashboardRoutes from './routes/dashboard.route.js';


import { ApiError } from './utils/ApiError.js';

const app = express();

// --- Load Swagger Document ---
const swaggerDocument = yaml.load(path.join(process.cwd(), 'src/docs/swagger.yaml'));

// --- Global Middlewares ---
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ---  Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ---  Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

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