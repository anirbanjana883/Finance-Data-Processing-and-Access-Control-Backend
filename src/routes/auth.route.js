import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// register
router.post('/register', validate(registerSchema), register);

// login (rate limit of 15 protected )
router.post('/login', loginLimiter, validate(loginSchema), login);

router.get('/me', verifyJWT, (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User profile fetched successfully")
    );
});

export default router;