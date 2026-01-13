import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, loginSchema } from './users.types';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), usersController.login);
router.post('/register', validateBody(createUserSchema), usersController.create);

// Protected routes
router.use(authenticate);

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.put('/:id', validateBody(updateUserSchema), usersController.update);
router.delete('/:id', authorize('ADMIN'), usersController.delete);

export default router;
