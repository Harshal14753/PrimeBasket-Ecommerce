import express from 'express';
import {
    createAddress,
    getMyAddresses,
    updateAddress,
    deleteAddress
} from '../controllers/address.controller.js';
import { authUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// authUser → verifies token | no role restriction (both customer & seller can manage addresses)
router.post('/',        authUser, createAddress);       // Create a new address
router.get('/',         authUser, getMyAddresses);      // Get all own addresses
router.put('/:id',      authUser, updateAddress);       // Update own address
router.delete('/:id',   authUser, deleteAddress);       // Delete own address

export default router;
