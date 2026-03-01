import express from 'express';
import { userLogin, userRegister, getProfile, logout } from '../controllers/user.controller.js';
import { authUser, authCustomer } from '../middleware/auth.middleware.js';

const router = express.Router();

// Private routes
router.get('/profile', authUser, getProfile);   // Any logged-in user
router.post('/logout', authUser, logout);        // Any logged-in user

export default router;