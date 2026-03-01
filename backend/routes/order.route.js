import express from 'express';
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getSellerOrders,
    updateItemStatus
} from '../controllers/order.controller.js';
import { authUser, authCustomer, authSeller } from '../middleware/auth.middleware.js';

const router = express.Router();


// ─────────────────────────────────────────────────────────────────────────────
// SELLER routes  (must be declared before /:id catch-all)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/seller/orders',                    authUser, authSeller, getSellerOrders);         // Get all orders containing seller's items
router.put('/seller/item/:itemId/status',       authUser, authSeller, updateItemStatus);        // Update fulfilment status for own item


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER routes
// ─────────────────────────────────────────────────────────────────────────────
router.post('/',            authUser, authCustomer, placeOrder);      // Place order from cart
router.get('/my',           authUser, authCustomer, getMyOrders);     // View own orders  (paginated)
router.get('/:id',          authUser, authCustomer, getOrderById);    // View single order
router.put('/:id/cancel',   authUser, authCustomer, cancelOrder);     // Cancel order (AWAITING_PAYMENT or PLACED only)


export default router;
