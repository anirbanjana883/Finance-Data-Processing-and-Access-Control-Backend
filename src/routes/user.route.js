import express from 'express';
import { create, getUsers, changeRole, changeStatus } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { userQuerySchema, createUserSchema, updateRoleSchema, updateStatusSchema } from '../validators/user.validator.js';

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles('ADMIN')); 

router.post('/', validate(createUserSchema), create);
router.get('/', validate(userQuerySchema), getUsers);
router.patch('/:id/role', validate(updateRoleSchema), changeRole);
router.patch('/:id/status', validate(updateStatusSchema), changeStatus);

export default router;