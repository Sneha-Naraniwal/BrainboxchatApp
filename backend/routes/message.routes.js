import { Router } from 'express';
import { getMessages } from '../controllers/message.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

// GET /messages/:projectId  →  fetch full chat history for a project
router.get('/:projectId',
    authMiddleWare.authUser,
    getMessages
);

export default router;
