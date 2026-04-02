import express from 'express';
import { create, getAll, update, remove } from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

// must be logged in 
router.use(verifyJWT);

// ADMIN - see all , VIEWER , ANALYST - see only their own 
router.get('/', getAll);

// ADMIN only 
router.post('/', authorizeRoles('ADMIN'), create);
router.patch('/:id', authorizeRoles('ADMIN'), update);
router.delete('/:id', authorizeRoles('ADMIN'), remove);

export default router;