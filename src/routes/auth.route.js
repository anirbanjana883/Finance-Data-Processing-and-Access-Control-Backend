import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// --- Public Routes ---
router.post('/register', register);
router.post('/login', login);

// --- Protected Routes ---
// The verifyJWT middleware ensures only logged-in users can access this
router.get('/me', verifyJWT, (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User profile fetched successfully")
    );
});

export default router;