import express from 'express';
import {
    createSeller,
    getSeller,
    updateSeller,
} from '../controllers/seller.controller.js';
import { getSellerOrderPaymentStatus } from '../controllers/payment.controller.js';
import { authUser, authSeller } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create', authUser, createSeller);                                              // Any logged-in user with seller role
router.get('/profile', authUser, authSeller, getSeller);                                     // Only verified seller
router.put('/profile/:id', authUser, authSeller, updateSeller);                              // Only verified seller
router.get('/payment/order/:orderId', authUser, authSeller, getSellerOrderPaymentStatus);    // View payment status for own orders


export default router;
