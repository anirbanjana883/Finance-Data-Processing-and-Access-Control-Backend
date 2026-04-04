import express from 'express';
import { getSummary } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// must be logged in 
router.use(verifyJWT);

router.get('/summary', getSummary);

export default router;