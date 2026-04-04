import express from 'express';
import { bootstrap, setupOrganization, login } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { bootstrapSchema, setupOrganizationSchema, loginSchema } from '../validators/auth.validator.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

// create master admin - lock afetr one use 
router.post('/bootstrap', validate(bootstrapSchema), bootstrap);

// teneant setup 
router.post('/organization', verifyJWT, authorizeRoles('MASTER_ADMIN'), validate(setupOrganizationSchema), setupOrganization);

// login
router.post('/login', loginLimiter, validate(loginSchema), login);

// check profile 
router.get('/me', verifyJWT, (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User profile fetched successfully")
    );
});

export default router;