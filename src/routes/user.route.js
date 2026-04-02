import express from 'express';
import { getUsers, changeRole, changeStatus } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// nust be logged in 
router.use(verifyJWT);

// mu8st be ADMIN
router.use(authorizeRoles('ADMIN'));

// --- Admin Only Routes ---
router.get('/', getUsers);
router.patch('/:id/role', changeRole);
router.patch('/:id/status', changeStatus);

export default router;