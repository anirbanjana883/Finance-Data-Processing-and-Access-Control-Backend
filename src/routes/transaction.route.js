// src/routes/transaction.routes.js
import express from 'express';
import { create, getAll, update, remove } from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { 
    transactionQuerySchema, 
    createTransactionSchema, 
    updateTransactionSchema 
} from '../validators/transaction.validator.js';

const router = express.Router();

router.use(verifyJWT);

// GET: All users can access, but service handles data isolation
router.get('/', validate(transactionQuerySchema), getAll);

// --- Admin Only Routes ---
router.post('/', authorizeRoles('ADMIN'), validate(createTransactionSchema), create);
router.patch('/:id', authorizeRoles('ADMIN'), validate(updateTransactionSchema), update);
router.delete('/:id', authorizeRoles('ADMIN'), remove);

export default router;