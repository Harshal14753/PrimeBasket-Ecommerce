import express from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from '../controllers/category.controller.js';
import { getAllSeller, approveSeller } from '../controllers/seller.controller.js';
import { getAllAddresses } from '../controllers/address.controller.js';
import { getAllProductsAdmin, approveProduct, blockProduct } from '../controllers/product.controller.js';
import { getAllVariantsAdmin, adminUpdateVariant, adminDeleteVariant, blockVariant } from '../controllers/productVariant.controller.js';
import { getAllPaymentsAdmin, updatePaymentStatus, refundPayment } from '../controllers/payment.controller.js';
import { getAllOrdersAdmin, getOrderById, updateOrderStatusAdmin, cancelOrder, updateItemStatus, processRefund } from '../controllers/order.controller.js';
import { authUser, authAdmin } from '../middleware/auth.middleware.js';


const router = express.Router();


//  Category routes (admin only)
router.get('/categories',       authUser, authAdmin, getCategories);
router.get('/category/:id',     authUser, authAdmin, getCategoryById);
router.post('/category',        authUser, authAdmin, createCategory);
router.put('/category/:id',     authUser, authAdmin, updateCategory);
router.delete('/category/:id',  authUser, authAdmin, deleteCategory);


// Seller verification routes (admin only)
router.get('/sellers',              authUser, authAdmin, getAllSeller);    // Get all sellers
router.put('/seller/verify/:id',    authUser, authAdmin, approveSeller);  // Verify/approve a seller


// Address routes (admin only - view all)
router.get('/addresses',            authUser, authAdmin, getAllAddresses); // Get all user addresses


// Product routes (admin only)
router.get('/products',                 authUser, authAdmin, getAllProductsAdmin); // Get all products (any status)
router.put('/product/approve/:id',      authUser, authAdmin, approveProduct);      // Approve a product
router.put('/product/block/:id',        authUser, authAdmin, blockProduct);        // Block a product


// Product Variant routes (admin only)
router.get('/variants',                 authUser, authAdmin, getAllVariantsAdmin);  // Get all variants (filter by productId, isActive)
router.put('/variant/block/:id',        authUser, authAdmin, blockVariant);        // Toggle block/unblock variant
router.put('/variant/:id',              authUser, authAdmin, adminUpdateVariant);  // Update any variant
router.delete('/variant/:id',           authUser, authAdmin, adminDeleteVariant);  // Delete any variant


// Payment routes (admin only)
router.get('/payments',                 authUser, authAdmin, getAllPaymentsAdmin);      // Get all payments (filter by status)
router.put('/payment/:id/status',       authUser, authAdmin, updatePaymentStatus);     // Manually override payment status
router.post('/payment/:id/refund',      authUser, authAdmin, refundPayment);           // Initiate refund


// Order routes (admin only)
router.get('/orders',                   authUser, authAdmin, getAllOrdersAdmin);        // Get all orders (filter by status, userId, paymentStatus)
router.get('/order/:id',                authUser, authAdmin, getOrderById);            // View any single order
router.put('/order/:id/status',         authUser, authAdmin, updateOrderStatusAdmin);  // Override order status
router.put('/order/:id/cancel',         authUser, authAdmin, cancelOrder);             // Cancel any cancellable order
router.put('/order/item/:itemId/status',authUser, authAdmin, updateItemStatus);        // Update any item's fulfilment status
router.post('/order/:id/refund',        authUser, authAdmin, processRefund);           // Cancel + refund order


export default router;