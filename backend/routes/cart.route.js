import express from 'express';
import {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
} from '../controllers/cart.controller.js';
import { authUser, authCustomer } from '../middleware/auth.middleware.js';

const router = express.Router();

// authUser + authCustomer → customers only
router.get('/',                 authUser, authCustomer, getCart);       // View cart
router.post('/add',             authUser, authCustomer, addItem);       // Add item (or increment qty)
router.put('/item/:itemId',     authUser, authCustomer, updateItem);    // Update item quantity
router.delete('/item/:itemId',  authUser, authCustomer, removeItem);    // Remove single item
router.delete('/',              authUser, authCustomer, clearCart);     // Clear entire cart

export default router;
