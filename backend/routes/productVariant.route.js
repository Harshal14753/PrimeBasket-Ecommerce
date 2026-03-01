import express from 'express';
import {
    createVariant,
    getSellerVariants,
    updateVariant,
    deleteVariant
} from '../controllers/productVariant.controller.js';
import { authUser, authSeller } from '../middleware/auth.middleware.js';

const router = express.Router();

// authUser + authSeller → verified seller only
router.post('/',                        authUser, authSeller, createVariant);         // Create variant for own product
router.get('/product/:productId',       authUser, authSeller, getSellerVariants);     // Get all variants of own product
router.put('/:id',                      authUser, authSeller, updateVariant);         // Update own variant (SKU auto-regen if attrs change)
router.delete('/:id',                   authUser, authSeller, deleteVariant);         // Delete own variant

export default router;
