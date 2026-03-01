import express from 'express';
import {
    initiatePayment,
    verifyPayment,
    getMyPayments,
    getPaymentById
} from '../controllers/payment.controller.js';
import { authUser, authCustomer } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/initiate',    authUser, authCustomer, initiatePayment);   // Create Razorpay order or COD payment
router.post('/verify',      authUser, authCustomer, verifyPayment);     // Verify Razorpay signature & confirm
router.get('/my',           authUser, authCustomer, getMyPayments);     // Get all own payments
router.get('/:id',          authUser, getPaymentById);                  // Get single payment (own or admin)

export default router;
