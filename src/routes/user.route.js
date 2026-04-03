// src/routes/user.routes.js
import express from 'express';
import { getUsers, changeRole, changeStatus } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { userQuerySchema, updateRoleSchema, updateStatusSchema } from '../validators/user.validator.js';

const router = express.Router();

// must be logged in 
router.use(verifyJWT);

// Middleware: Must be ADMIN for all routes in this file
router.use(authorizeRoles('ADMIN'));

// --- Admin Only Routes ---
router.get('/', validate(userQuerySchema), getUsers);

router.patch('/:id/role', validate(updateRoleSchema), changeRole);

router.patch('/:id/status', validate(updateStatusSchema), changeStatus);

export default router;