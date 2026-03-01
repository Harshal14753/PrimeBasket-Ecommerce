import express from 'express';
import {
    createProduct,
    getMyProducts,
    updateProduct,
    deleteProduct
} from '../controllers/product.controller.js';
import { authUser, authSeller } from '../middleware/auth.middleware.js';

const router = express.Router();

// authUser + authSeller → verified seller only
router.post('/',        authUser, authSeller, createProduct);   // List a new product
router.get('/',         authUser, authSeller, getMyProducts);   // Get own products
router.put('/:id',      authUser, authSeller, updateProduct);   // Update own product
router.delete('/:id',   authUser, authSeller, deleteProduct);   // Delete own product

export default router;
