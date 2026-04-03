import express from 'express';
import { getSummary } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// loggin user 
router.use(verifyJWT);

// viewrs - own stats ,  analyst, admin - all
router.get('/summary', getSummary);

export default router;