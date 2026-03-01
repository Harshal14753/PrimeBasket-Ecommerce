import express from 'express';
import { getCategories, getCategoryById } from '../controllers/category.controller.js';
import { userLogin, userRegister } from '../controllers/user.controller.js';
import { getProducts, getProductById } from '../controllers/product.controller.js';
import { getPublicVariants } from '../controllers/productVariant.controller.js';

const router = express.Router();

// Auth routes for guest users
router.post('/login',    userLogin);
router.post('/register', userRegister);

// Public category routes
router.get('/categories',     getCategories);
router.get('/category/:id',   getCategoryById);

// Public product routes
router.get('/products',                         getProducts);           // Browse all approved products (search + filter)
router.get('/product/:id',                      getProductById);        // View a single approved product
router.get('/product/:productId/variants',      getPublicVariants);     // View active variants of an approved product

export default router;